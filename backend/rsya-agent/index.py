import json
import os
from typing import Dict, Any, List, Optional
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    AI-агент для управления проектами чистки РСЯ через natural language
    Использует Google Gemini 2.5 Flash для понимания запросов и выполнения действий
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Читаем данные запроса
    body_str = event.get('body', '{}')
    data = json.loads(body_str) if isinstance(body_str, str) else body_str
    
    user_id = event.get('headers', {}).get('X-User-Id', '1')
    user_message = data.get('message', '')
    project_id = data.get('project_id')
    conversation_history = data.get('history', [])
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Сообщение не может быть пустым'})
        }
    
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    
    if not gemini_api_key:
        return error_response('GEMINI_API_KEY not configured. Получите ключ на https://aistudio.google.com/apikey')
    
    try:
        # Формируем промпт для Gemini (без предзагрузки данных из БД)
        system_prompt = build_system_prompt(project_id)
        
        # Вызываем Gemini API
        gemini_response = call_gemini_api(
            api_key=gemini_api_key,
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history
        )
        
        # Парсим ответ агента
        agent_message = gemini_response.get('text', '')
        actions = []  # TODO: добавить function calling позже
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': agent_message,
                'actions': actions
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        print(f'❌ Error in agent handler: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(str(e))


# Убрал get_project_context — больше не грузим 230K строк при каждом запросе!


def build_system_prompt(project_id: Optional[int]) -> str:
    '''Формирует system prompt для Gemini'''
    
    prompt = """Ты — AI-ассистент для настройки автоматической чистки РСЯ (Рекламная Сеть Яндекса).

Твоя задача: помочь пользователю:
1. Подключить Яндекс.Директ через OAuth
2. Настроить автоматическую чистку площадок
3. Объяснить как работает система

ВАЖНО:
- Пока ты НЕ можешь анализировать статистику (это будет добавлено позже)
- Сейчас ты помогаешь только с настройкой и объяснениями
- Отвечай кратко и по делу на русском языке

Если пользователь спросит про статистику — скажи что эта функция пока в разработке."""

    if project_id:
        prompt += f"\n\nТекущий проект ID: {project_id}"
    
    return prompt


def call_gemini_api(
    api_key: str,
    system_prompt: str,
    user_message: str,
    conversation_history: List[Dict]
) -> Dict:
    '''Вызывает Gemini 2.0 Flash API (экспериментальный)'''
    
    # Формируем историю для Gemini
    contents = []
    
    # Добавляем историю разговора
    for msg in conversation_history[-10:]:  # Последние 10 сообщений
        role = "user" if msg['role'] == 'user' else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg['content']}]
        })
    
    # Добавляем текущее сообщение пользователя
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })
    
    # API endpoint для Gemini 2.0 Flash (экспериментальная версия)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
    
    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048
        }
    }
    
    # Проверяем есть ли прокси (сначала GEMINI_PROXY_URL, потом fallback на OPENAI_PROXY_URL)
    proxy_url = os.environ.get('GEMINI_PROXY_URL') or os.environ.get('OPENAI_PROXY_URL')
    proxies = None
    
    if proxy_url:
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        print(f'🔒 Using proxy: {proxy_url[:20]}...')
    
    # Настраиваем session с retry и адаптером
    session = requests.Session()
    
    # Retry стратегия
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    if proxies:
        session.proxies.update(proxies)
    
    # Пробуем с прокси (если есть) или без
    try:
        response = session.post(url, json=payload, timeout=60)
        
        if response.status_code != 200:
            error_text = response.text
            print(f'❌ Gemini API error: {response.status_code}')
            print(f'Error text: {error_text[:500]}')
            
            # Если геоблокировка — даём понятную инструкцию
            if 'not supported' in error_text.lower() or 'failed_precondition' in error_text.lower():
                if proxy_url:
                    return {
                        'text': f'''❌ Gemini API недоступен даже через прокси.

**Проблема:** Запрос заблокирован (геоблокировка)
**Прокси:** {proxy_url[:30]}...

**Решение:**
1. Проверь что прокси работает (попробуй через браузер)
2. Используй VPN-прокси (не HTTP-прокси)
3. Или получи ключ через VPN и используй напрямую

Технические детали: {error_text[:200]}''',
                        'function_calls': []
                    }
                else:
                    return {
                        'text': '''❌ Gemini API недоступен из России.

**Решение:**
1. Добавь рабочий HTTP/HTTPS прокси в секрет `GEMINI_PROXY_URL`
   Формат: `http://user:pass@host:port`
2. Или используй VPN при создании ключа
3. Получи ключ: https://aistudio.google.com/apikey

Попробуй снова после добавления прокси.''',
                        'function_calls': []
                    }
            
            raise Exception(f"Gemini API error: {response.status_code} - {error_text[:300]}")
        
    except requests.exceptions.ProxyError as e:
        print(f'❌ Proxy error: {str(e)}')
        return {
            'text': f'''❌ Ошибка подключения к прокси.

**Проблема:** Прокси не отвечает или недоступен
**Прокси:** {proxy_url[:50] if proxy_url else 'не настроен'}...

**Решение:**
1. Проверь что прокси работает
2. Формат должен быть: `http://user:pass@host:port`
3. Или используй другой прокси сервер

Технические детали: {str(e)[:200]}''',
            'function_calls': []
        }
        
    except requests.exceptions.ConnectionError as e:
        print(f'❌ Connection error: {str(e)}')
        if proxy_url:
            return {
                'text': f'''❌ Не удалось подключиться через прокси.

**Прокси:** {proxy_url[:50]}...

**Решение:**
1. Проверь что прокси доступен
2. Попробуй другой прокси
3. Или убери `OPENAI_PROXY_URL` и используй VPN

Технические детали: {str(e)[:200]}''',
                'function_calls': []
            }
        else:
            return {
                'text': '''❌ Не удалось подключиться к Gemini API.

**Причина:** Gemini API заблокирован в России

**Решение:**
1. Добавь рабочий прокси в секрет `GEMINI_PROXY_URL`
2. Или используй VPN

Агент работает только с доступом к Gemini API.''',
                'function_calls': []
            }
    
    result = response.json()
    
    # Парсим ответ
    candidates = result.get('candidates', [])
    if not candidates:
        raise Exception("Gemini API returned no candidates")
    
    content = candidates[0].get('content', {})
    parts = content.get('parts', [])
    
    if not parts:
        raise Exception("Gemini API returned empty response")
    
    text = parts[0].get('text', '')
    
    return {
        'text': text,
        'function_calls': []  # TODO: Добавить function calling позже
    }


def execute_function(
    cursor,
    conn,
    user_id: str,
    project_id: Optional[int],
    function_name: str,
    function_args: Dict
) -> Dict:
    '''Выполняет функцию, запрошенную агентом'''
    # TODO: Реализовать function calling для действий
    # Например: block_platforms, create_task, get_platforms_stats
    return {
        'function': function_name,
        'status': 'not_implemented',
        'message': 'Function calling будет добавлен в следующей версии'
    }


def error_response(message: str) -> Dict:
    '''Возвращает ошибку'''
    return {
        'statusCode': 500,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }