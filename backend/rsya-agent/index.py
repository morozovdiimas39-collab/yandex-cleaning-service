import json
import os
from typing import Dict, Any, List, Optional
import psycopg2
import psycopg2.extras
import requests

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
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    
    if not dsn:
        return error_response('DATABASE_URL not configured')
    
    if not gemini_api_key:
        return error_response('GEMINI_API_KEY not configured. Получите ключ на https://aistudio.google.com/apikey')
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем контекст проекта если указан
        project_context = None
        if project_id:
            project_context = get_project_context(cursor, project_id, user_id)
        
        # Формируем промпт для Gemini
        system_prompt = build_system_prompt(project_context)
        
        # Вызываем Gemini API
        gemini_response = call_gemini_api(
            api_key=gemini_api_key,
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history
        )
        
        # Парсим ответ агента
        agent_message = gemini_response.get('text', '')
        function_calls = gemini_response.get('function_calls', [])
        
        # Если агент хочет выполнить функции
        actions = []
        if function_calls:
            for func_call in function_calls:
                action_result = execute_function(
                    cursor=cursor,
                    conn=conn,
                    user_id=user_id,
                    project_id=project_id,
                    function_name=func_call['name'],
                    function_args=func_call['args']
                )
                actions.append(action_result)
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': agent_message,
                'actions': actions,
                'requires_confirmation': len(function_calls) > 0
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        print(f'❌ Error in agent handler: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(str(e))


def get_project_context(cursor, project_id: int, user_id: str) -> Optional[Dict]:
    '''Получает контекст проекта из БД'''
    schema = 't_p97630513_yandex_cleaning_serv'
    
    cursor.execute(f"""
        SELECT id, name, yandex_token, campaign_ids, counter_ids, created_at
        FROM {schema}.rsya_projects
        WHERE id = %s AND user_id = %s
    """, (project_id, user_id))
    
    project = cursor.fetchone()
    if not project:
        return None
    
    # Получаем задачи проекта
    cursor.execute(f"""
        SELECT id, description, enabled, config
        FROM {schema}.rsya_tasks
        WHERE project_id = %s
        ORDER BY created_at DESC
        LIMIT 10
    """, (project_id,))
    
    tasks = cursor.fetchall()
    
    # Получаем статистику площадок
    cursor.execute(f"""
        SELECT 
            COUNT(DISTINCT domain) as total_platforms,
            SUM(cost) as total_cost,
            SUM(clicks) as total_clicks,
            SUM(conversions) as total_conversions
        FROM {schema}.rsya_platform_stats
        WHERE project_id = %s
    """, (project_id,))
    
    stats = cursor.fetchone()
    
    return {
        'project': dict(project),
        'tasks': [dict(t) for t in tasks],
        'stats': dict(stats) if stats else {}
    }


def build_system_prompt(project_context: Optional[Dict]) -> str:
    '''Формирует system prompt для Gemini с контекстом'''
    
    base_prompt = """Ты — AI-ассистент для управления проектами чистки площадок РСЯ (Рекламная Сеть Яндекса).

Твоя задача: помогать пользователю управлять рекламными кампаниями через естественный язык.

Что ты умеешь:
1. Анализировать данные площадок РСЯ (домены, клики, расходы, конверсии)
2. Создавать задачи автоматической блокировки по фильтрам
3. Предлагать оптимизации на основе статистики
4. Объяснять почему площадку стоит заблокировать

Примеры запросов:
- "Покажи площадки без конверсий"
- "Заблокируй все .com домены с расходом больше 500₽"
- "Создай задачу: блокировать площадки с CPA выше 1000₽"
- "Почему так много расхода на игры?"

ВАЖНО:
- Всегда анализируй РЕАЛЬНЫЕ данные из БД, не придумывай
- Перед блокировкой площадок — спрашивай подтверждение
- Объясняй свои рекомендации понятно и кратко
- Используй рубли (₽) для стоимости

Отвечай на русском языке, дружелюбно и по делу."""

    if project_context:
        project = project_context['project']
        stats = project_context['stats']
        tasks = project_context['tasks']
        
        context_info = f"""

ТЕКУЩИЙ ПРОЕКТ: {project['name']} (ID: {project['id']})

Статистика проекта:
- Всего площадок: {stats.get('total_platforms', 0)}
- Общий расход: {float(stats.get('total_cost', 0)):.2f}₽
- Всего кликов: {stats.get('total_clicks', 0)}
- Конверсий: {stats.get('total_conversions', 0)}

Активных задач чистки: {len([t for t in tasks if t['enabled']])}
"""
        base_prompt += context_info
    
    return base_prompt


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
    
    # Проверяем есть ли прокси
    proxy_url = os.environ.get('OPENAI_PROXY_URL')
    proxies = None
    
    if proxy_url:
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        print(f'🔒 Using proxy: {proxy_url[:20]}...')
    
    # Пробуем с прокси (если есть) или без
    try:
        response = requests.post(url, json=payload, timeout=30, proxies=proxies)
        
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
1. Добавь рабочий HTTP/HTTPS прокси в секрет `OPENAI_PROXY_URL`
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
1. Добавь рабочий прокси в секрет `OPENAI_PROXY_URL`
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