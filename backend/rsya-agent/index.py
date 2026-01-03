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
        
        # Определяем доступные функции для агента
        available_functions = get_available_functions()
        
        # Вызываем Gemini API
        gemini_response = call_gemini_api(
            api_key=gemini_api_key,
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
            available_functions=available_functions
        )
        
        # Парсим ответ агента
        agent_message = gemini_response.get('text', '')
        function_calls = gemini_response.get('function_calls', [])
        
        # Если агент хочет выполнить функции
        actions = []
        if function_calls:
            for func_call in function_calls:
                action_result = execute_function(
                    user_id=user_id,
                    project_id=project_id,
                    function_name=func_call['name'],
                    function_args=func_call['args']
                )
                actions.append(action_result)
            
            # КРИТИЧЕСКИ ВАЖНО: Отправляем результаты функций обратно в Gemini для анализа
            print(f'🔄 Sending function results back to Gemini for analysis...')
            
            analysis_response = call_gemini_api(
                api_key=gemini_api_key,
                system_prompt=system_prompt,
                user_message=user_message,
                conversation_history=conversation_history,
                available_functions=available_functions,
                function_results=actions  # Передаём результаты функций
            )
            
            # Берём финальный ответ после анализа результатов
            agent_message = analysis_response.get('text', agent_message)
        
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
    
    prompt = """Ты — Антон, профессиональный ассистент по чистке РСЯ (Яндекс.Директ).

🚨 WORKFLOW - СТРОГО ПО ШАГАМ:

ШАГ 1: Пользователь пишет "проанализируй площадки"
→ Ты СРАЗУ вызываешь get_conversion_goals()
→ Показываешь цели с чекбоксами и спрашиваешь:
  "Выбери важные цели для анализа (через запятую номера):"

ШАГ 2: Пользователь выбрал цели (например: "1, 3, 5")
→ Ты спрашиваешь: "Какая целевая цена конверсии? (сколько рублей готов платить за лид)"

ШАГ 3: Пользователь указал цену (например: "500")
→ Ты СРАЗУ вызываешь analyze_rsya_platforms() с:
  - selected_goal_ids (ID выбранных целей)
  - target_cpa (целевая цена)

ШАГ 4: После получения результатов анализа
→ Показываешь таблицу с площадками на блокировку
→ Объясняешь ПОЧЕМУ каждая блокируется
→ Спрашиваешь: "Заблокировать эти площадки?"

ШАГ 5: Пользователь подтвердил
→ Вызываешь create_blocking_task() с платформами из анализа

⚠️ ВАЖНО: НЕ пиши "сейчас сделаю" — СРАЗУ вызывай функции!

🎯 ФОРМАТ ОТВЕТОВ:

При показе целей (get_conversion_goals):
```
📊 Найдено {N} целей конверсии:

1. Заявка на консультацию (ID: 12345)
2. Покупка товара (ID: 67890)
3. Регистрация (ID: 11111)

Напиши номера важных целей через запятую (например: 1, 2)
```

После analyze_rsya_platforms:
```
📊 АНАЛИЗ ПЛОЩАДОК ЗА 3 ПЕРИОДА

Проанализировал {total} площадок (сегодня + вчера + 7 дней)
Найдено {count} проблемных → экономия {savings}₽

🗑️ ЧТО БЛОКИРУЕМ:

1. Мусорные домены ({N} шт):
   • fraudbot.com — 1500₽, CTR 3%, 0 конв.
     Причина: .com домен, ботовый трафик
   
2. Высокий CTR без конверсий ({N} шт):
   • site1.ru — 800₽, CTR 5%, 0 конв.
     Причина: Кликают но не покупают
   
3. Дорогой CPA ({N} шт):
   • site2.ru — 2500₽, CPA 1200₽ > твой лимит 500₽
     Причина: Неэффективно, переплата 140%

✅ ОСТАВЛЯЕМ:
• com.vkontakte.android — whitelist
• avito.ru — 5 конверсий, CPA 350₽

💰 ЭКОНОМИЯ: {savings}₽

Заблокировать эти площадки? (да/нет)
```

Ты — эксперт-директолог. Всегда объясняй ПОЧЕМУ блокируем."""

    if project_id:
        prompt += f"\n\nТекущий проект ID: {project_id}"
    
    return prompt


def call_gemini_api(
    api_key: str,
    system_prompt: str,
    user_message: str,
    conversation_history: List[Dict],
    available_functions: List[Dict],
    function_results: List[Dict] = None
) -> Dict:
    '''Вызывает Gemini 2.5 Flash API с function calling'''   
    
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
    
    # Если есть результаты функций - добавляем их для анализа
    if function_results:
        function_responses = []
        for result in function_results:
            function_responses.append({
                "functionResponse": {
                    "name": result.get('function', 'unknown'),
                    "response": {
                        "status": result.get('status', 'success'),
                        "data": result.get('data', {}),
                        "message": result.get('message', '')
                    }
                }
            })
        
        contents.append({
            "role": "model",
            "parts": function_responses
        })
    
    # API endpoint для Gemini 2.5 Flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "tools": [{
            "functionDeclarations": available_functions
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192
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
    
    # Логируем полный ответ для отладки
    print(f'📥 Gemini response: {json.dumps(result, ensure_ascii=False)[:1000]}...')
    
    # Парсим ответ
    candidates = result.get('candidates', [])
    if not candidates:
        print(f'❌ No candidates in response: {json.dumps(result, ensure_ascii=False)[:500]}')
        raise Exception("Gemini API returned no candidates")
    
    content = candidates[0].get('content', {})
    parts = content.get('parts', [])
    
    if not parts:
        print(f'❌ No parts in content: {json.dumps(content, ensure_ascii=False)[:500]}')
        print(f'Full candidate: {json.dumps(candidates[0], ensure_ascii=False)[:1000]}')
        raise Exception("Gemini API returned empty response")
    
    # Проверяем есть ли вызовы функций
    function_calls = []
    text = ''
    
    for part in parts:
        if 'text' in part:
            text = part['text']
        elif 'functionCall' in part:
            func_call = part['functionCall']
            function_calls.append({
                'name': func_call['name'],
                'args': func_call.get('args', {})
            })
    
    return {
        'text': text,
        'function_calls': function_calls
    }


def get_available_functions() -> List[Dict]:
    '''Возвращает список функций доступных агенту'''
    return [
        {
            "name": "get_campaigns",
            "description": "Получить список рекламных кампаний из Яндекс.Директ",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Статус кампаний: ACTIVE (активные), DRAFT (черновики), ARCHIVED (архивные), SUSPENDED (приостановленные), ALL (все)",
                        "enum": ["ACTIVE", "DRAFT", "ARCHIVED", "SUSPENDED", "ALL"]
                    }
                },
                "required": []
            }
        },
        {
            "name": "get_conversion_goals",
            "description": "Получить список целей конверсии из Метрики для выбора пользователем",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        },
        {
            "name": "analyze_rsya_platforms",
            "description": "Анализировать площадки РСЯ за 3 периода (сегодня, вчера, 7 дней) и найти неэффективные для блокировки. ТРЕБУЕТ: selected_goal_ids (массив ID целей), target_cpa (целевая цена конверсии)",
            "parameters": {
                "type": "object",
                "properties": {
                    "campaign_ids": {
                        "type": "array",
                        "description": "ID кампаний для анализа",
                        "items": {"type": "string"}
                    },
                    "selected_goal_ids": {
                        "type": "array",
                        "description": "ID выбранных целей конверсии (ОБЯЗАТЕЛЬНО)",
                        "items": {"type": "string"}
                    },
                    "target_cpa": {
                        "type": "number",
                        "description": "Целевая цена конверсии в рублях (ОБЯЗАТЕЛЬНО)"
                    }
                },
                "required": ["selected_goal_ids", "target_cpa"]
            }
        },
        {
            "name": "create_blocking_task",
            "description": "Создать задачу на блокировку площадок через Message Queue",
            "parameters": {
                "type": "object",
                "properties": {
                    "platforms": {
                        "type": "array",
                        "description": "Список площадок для блокировки",
                        "items": {"type": "object"}
                    }
                },
                "required": ["platforms"]
            }
        }
    ]


def execute_function(
    user_id: str,
    project_id: Optional[int],
    function_name: str,
    function_args: Dict
) -> Dict:
    '''Выполняет функцию, запрошенную агентом'''
    
    if function_name == 'get_campaigns':
        return get_campaigns_function(user_id, project_id, function_args)
    elif function_name == 'get_conversion_goals':
        return get_conversion_goals_function(user_id, project_id, function_args)
    elif function_name == 'analyze_rsya_platforms':
        return analyze_rsya_platforms_function(user_id, project_id, function_args)
    elif function_name == 'create_blocking_task':
        return create_blocking_task_function(user_id, project_id, function_args)
    
    return {
        'function': function_name,
        'status': 'error',
        'message': f'Функция {function_name} не найдена'
    }


def get_campaigns_function(user_id: str, project_id: Optional[int], args: Dict) -> Dict:
    '''Получает кампании из Яндекс.Директ через API'''
    
    if not project_id:
        return {
            'function': 'get_campaigns',
            'status': 'error',
            'message': 'Не выбран проект. Выбери проект слева чтобы я мог получить данные.'
        }
    
    try:
        import psycopg2
        import psycopg2.extras
        
        # Подключаемся к БД чтобы получить токен
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        schema = 't_p97630513_yandex_cleaning_serv'
        
        # Получаем токен проекта
        cursor.execute(f"""
            SELECT yandex_token
            FROM {schema}.rsya_projects
            WHERE id = %s AND user_id = %s
        """, (project_id, user_id))
        
        project = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not project or not project['yandex_token']:
            return {
                'function': 'get_campaigns',
                'status': 'error',
                'message': 'Проект не подключён к Яндекс.Директ. Сначала авторизуйся в настройках проекта.'
            }
        
        # Вызываем Yandex Direct API
        status_filter = args.get('status', 'ACTIVE')
        campaigns = fetch_campaigns_from_direct(project['yandex_token'], status_filter)
        
        return {
            'function': 'get_campaigns',
            'status': 'success',
            'data': campaigns,
            'message': f'Найдено кампаний: {len(campaigns)}'
        }
        
    except Exception as e:
        return {
            'function': 'get_campaigns',
            'status': 'error',
            'message': f'Ошибка получения кампаний: {str(e)}'
        }


def fetch_campaigns_from_direct(token: str, status_filter: str) -> List[Dict]:
    '''Запрашивает ВСЕ кампании через Reports API (включая товарные и мастера кампаний)'''
    
    # Reports API — единственный способ получить товарные и мастера кампаний
    url = 'https://api.direct.yandex.com/json/v5/reports'
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    # Фильтр для Reports API (если нужен)
    # Reports API возвращает ВСЕ кампании включая SMARTBANNER и MCBANNER
    
    # Запрашиваем данные за последние 30 дней
    import datetime
    today = datetime.date.today()
    date_from = (today - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    date_to = today.strftime('%Y-%m-%d')
    
    payload = {
        'params': {
            'SelectionCriteria': {
                'DateFrom': date_from,
                'DateTo': date_to
            },
            'FieldNames': [
                'CampaignId',
                'CampaignName',
                'CampaignType',
                'Impressions',
                'Clicks',
                'Cost',
                'Conversions'
            ],
            'ReportName': 'Campaigns Report',
            'ReportType': 'CAMPAIGN_PERFORMANCE_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO'
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        if response.status_code != 200:
            raise Exception(f'Yandex Reports API error: {response.status_code} - {response.text[:200]}')
        
        # Парсим TSV ответ
        lines = response.text.strip().split('\n')
        if len(lines) < 2:
            return []
        
        # Первая строка — заголовки
        headers_line = lines[0].split('\t')
        
        campaigns = []
        seen_ids = set()
        
        # Парсим данные (группируем по CampaignId)
        for line in lines[1:]:
            values = line.split('\t')
            if len(values) < len(headers_line):
                continue
                
            campaign_id = values[0]
            
            # Пропускаем дубликаты (Reports API может вернуть несколько строк на кампанию)
            if campaign_id in seen_ids:
                continue
            seen_ids.add(campaign_id)
            
            campaigns.append({
                'id': campaign_id,
                'name': values[1],
                'type': values[2],
                'impressions': int(values[3]) if values[3] != '--' else 0,
                'clicks': int(values[4]) if values[4] != '--' else 0,
                'cost': float(values[5]) if values[5] != '--' else 0.0,
                'conversions': int(values[6]) if values[6] != '--' else 0
            })
        
        # Фильтруем по статусу если нужно
        if status_filter == 'ACTIVE':
            # Считаем активными те что имели показы за последние 30 дней
            campaigns = [c for c in campaigns if c['impressions'] > 0]
        
        return campaigns
        
    except Exception as e:
        raise Exception(f'Ошибка запроса к Reports API: {str(e)}')


def analyze_rsya_platforms_function(user_id: str, project_id: Optional[int], args: Dict) -> Dict:
    '''Анализирует площадки РСЯ и находит неэффективные для блокировки'''
    
    if not project_id:
        return {
            'function': 'analyze_rsya_platforms',
            'status': 'error',
            'message': 'Не выбран проект. Выбери проект слева чтобы я мог проанализировать площадки.'
        }
    
    try:
        import psycopg2
        import psycopg2.extras
        import datetime
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        schema = 't_p97630513_yandex_cleaning_serv'
        
        cursor.execute(f"""
            SELECT yandex_token
            FROM {schema}.rsya_projects
            WHERE id = %s AND user_id = %s
        """, (project_id, user_id))
        
        project = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not project or not project['yandex_token']:
            return {
                'function': 'analyze_rsya_platforms',
                'status': 'error',
                'message': 'Проект не подключён к Яндекс.Директ. Сначала авторизуйся в настройках проекта.'
            }
        
        campaign_ids = args.get('campaign_ids', [])
        selected_goal_ids = args.get('selected_goal_ids', [])
        target_cpa = args.get('target_cpa', 0)
        
        if not selected_goal_ids:
            return {
                'function': 'analyze_rsya_platforms',
                'status': 'error',
                'message': 'Не выбраны цели конверсии. Сначала выбери цели через get_conversion_goals.'
            }
        
        if not target_cpa or target_cpa <= 0:
            return {
                'function': 'analyze_rsya_platforms',
                'status': 'error',
                'message': 'Не указана целевая цена конверсии. Укажи сколько рублей ты готов платить за конверсию.'
            }
        
        platforms_analysis = fetch_and_analyze_platforms(
            token=project['yandex_token'],
            campaign_ids=campaign_ids,
            selected_goal_ids=selected_goal_ids,
            target_cpa=target_cpa
        )
        
        return {
            'function': 'analyze_rsya_platforms',
            'status': 'success',
            'data': platforms_analysis,
            'message': f'Проанализировано площадок: {platforms_analysis["total_analyzed"]}'
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'function': 'analyze_rsya_platforms',
            'status': 'error',
            'message': f'Ошибка анализа площадок: {str(e)}'
        }


def get_conversion_goals_function(user_id: str, project_id: Optional[int], args: Dict) -> Dict:
    '''Получает список целей конверсии из Яндекс.Метрики'''
    
    if not project_id:
        return {
            'function': 'get_conversion_goals',
            'status': 'error',
            'message': 'Не выбран проект'
        }
    
    try:
        import psycopg2
        import psycopg2.extras
        
        print(f'🎯 Getting goals for project_id={project_id}, user_id={user_id}')
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        schema = 't_p97630513_yandex_cleaning_serv'
        
        cursor.execute(f"""
            SELECT yandex_token, counter_ids
            FROM {schema}.rsya_projects
            WHERE id = %s AND user_id = %s
        """, (project_id, user_id))
        
        project = cursor.fetchone()
        
        print(f'📊 Project data: token={bool(project and project.get("yandex_token"))}, counter_ids={project.get("counter_ids") if project else None}')
        
        if not project or not project['yandex_token']:
            cursor.close()
            conn.close()
            return {
                'function': 'get_conversion_goals',
                'status': 'error',
                'message': 'Проект не подключён к Яндекс.Директ'
            }
        
        # Если counter_ids пустой или None → получаем список счётчиков
        counter_id = None
        if project.get('counter_ids') and len(project['counter_ids']) > 0:
            counter_id = project['counter_ids'][0]
        
        if not counter_id:
            print('🔍 counter_ids is empty, fetching counters from Metrika...')
            
            # Получаем список счётчиков пользователя
            counters_url = 'https://api-metrika.yandex.net/management/v1/counters'
            headers = {'Authorization': f'OAuth {project["yandex_token"]}'}
            
            counters_response = requests.get(counters_url, headers=headers, timeout=30)
            
            if counters_response.status_code != 200:
                cursor.close()
                conn.close()
                print(f'❌ Counters API error: {counters_response.text[:500]}')
                raise Exception(f'Не удалось получить счётчики Метрики: {counters_response.status_code}')
            
            counters_data = counters_response.json()
            counters = counters_data.get('counters', [])
            
            print(f'📊 Found {len(counters)} counters')
            
            if not counters:
                cursor.close()
                conn.close()
                return {
                    'function': 'get_conversion_goals',
                    'status': 'error',
                    'message': 'У этого аккаунта нет счётчиков Метрики. Создай счётчик на metrika.yandex.ru'
                }
            
            # Берём первый счётчик
            counter_id = counters[0]['id']
            print(f'✅ Using first counter: {counter_id} ({counters[0].get("name", "Unnamed")})')
            
            # Сохраняем в БД для следующих раз
            cursor.execute(f"""
                UPDATE {schema}.rsya_projects
                SET counter_ids = %s
                WHERE id = %s
            """, ([counter_id], project_id))
            conn.commit()
            print(f'💾 Saved counter_id to database')
        
        cursor.close()
        conn.close()
        
        # Получаем цели из Метрики через Management API
        print(f'🔍 Fetching goals from Metrika counter_id={counter_id}')
        
        url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}/goals'
        headers = {'Authorization': f'OAuth {project["yandex_token"]}'}
        
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f'📥 Metrika API response: status={response.status_code}')
        
        if response.status_code != 200:
            print(f'❌ Metrika API error: {response.text[:500]}')
            raise Exception(f'Metrika API error: {response.status_code} - {response.text[:200]}')
        
        data = response.json()
        goals = data.get('goals', [])
        
        print(f'✅ Found {len(goals)} goals')
        
        # Форматируем цели для пользователя
        formatted_goals = [
            {
                'id': str(goal['id']),
                'name': goal['name'],
                'type': goal.get('type', 'unknown')
            }
            for goal in goals
        ]
        
        return {
            'function': 'get_conversion_goals',
            'status': 'success',
            'data': formatted_goals,
            'message': f'Найдено целей: {len(formatted_goals)}'
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f'❌ Error in get_conversion_goals: {str(e)}')
        return {
            'function': 'get_conversion_goals',
            'status': 'error',
            'message': f'Ошибка получения целей: {str(e)}'
        }


def create_blocking_task_function(user_id: str, project_id: Optional[int], args: Dict) -> Dict:
    '''Создаёт задачу на блокировку площадок через Message Queue'''
    
    if not project_id:
        return {
            'function': 'create_blocking_task',
            'status': 'error',
            'message': 'Не выбран проект'
        }
    
    platforms = args.get('platforms', [])
    
    if not platforms:
        return {
            'function': 'create_blocking_task',
            'status': 'error',
            'message': 'Не указаны площадки для блокировки'
        }
    
    try:
        # Отправляем в Message Queue через Yandex Cloud
        import boto3
        
        queue_url = os.environ.get('YMQ_QUEUE_URL')
        aws_key_id = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
        
        if not all([queue_url, aws_key_id, aws_secret]):
            raise Exception('Message Queue не настроен')
        
        sqs = boto3.client(
            'sqs',
            endpoint_url='https://message-queue.api.cloud.yandex.net',
            region_name='ru-central1',
            aws_access_key_id=aws_key_id,
            aws_secret_access_key=aws_secret
        )
        
        # Формируем сообщение для MQ
        from datetime import datetime as dt
        
        message_body = json.dumps({
            'project_id': project_id,
            'user_id': user_id,
            'platforms': platforms,
            'action': 'block',
            'created_at': dt.now().isoformat()
        }, ensure_ascii=False)
        
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=message_body
        )
        
        return {
            'function': 'create_blocking_task',
            'status': 'success',
            'data': {
                'platforms_count': len(platforms),
                'queue': 'rsya_blocking'
            },
            'message': f'Задача создана! Будет заблокировано {len(platforms)} площадок.'
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'function': 'create_blocking_task',
            'status': 'error',
            'message': f'Ошибка создания задачи: {str(e)}'
        }


def fetch_and_analyze_platforms(token: str, campaign_ids: List[str], selected_goal_ids: List[str], target_cpa: float) -> Dict:
    '''Запрашивает статистику площадок за 3 периода и анализирует с учётом целей'''
    
    import datetime
    
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    week_ago = today - datetime.timedelta(days=7)
    
    # Whitelist - НЕ блокируем даже если .com
    whitelist_exact = [
        'com.avito.android',
        'com.vkontakte.android',
        'com.opera.browser',
        'com.yandex.shedevrus',
        'free.vpn.proxy.secure',
        'avito.ru', 'avito.com',
        'vk.com', 'vk.ru',
        'ok.ru', 'odnoklassniki.ru',
        'yandex.ru', 'ya.ru',
        'mail.ru',
        'youtube.com', 'youtu.be'
    ]
    
    # Мусорные паттерны (блокируем если НЕ в whitelist)
    trash_patterns = ['.com', '.dsp', '.vvpn', '.vpn', 'unknown', '.tk', '.ml', '.ga', '.cf']
    
    # Запрашиваем данные за 3 периода
    periods = [
        ('today', today, today),
        ('yesterday', yesterday, yesterday),
        ('week', week_ago, today)
    ]
    
    all_platforms = {}  # Ключ: domain, Значение: агрегированные данные
    
    url = 'https://api.direct.yandex.com/json/v5/reports'
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    for period_name, date_from, date_to in periods:
        print(f'📊 Fetching platforms for {period_name}: {date_from} - {date_to}')
        
        selection_criteria = {
            'DateFrom': date_from.strftime('%Y-%m-%d'),
            'DateTo': date_to.strftime('%Y-%m-%d')
        }
        
        if campaign_ids:
            selection_criteria['CampaignIds'] = campaign_ids
        
        payload = {
            'params': {
                'SelectionCriteria': selection_criteria,
                'FieldNames': [
                    'CampaignId',
                    'Placement',
                    'Impressions',
                    'Clicks',
                    'Cost',
                    'Conversions',
                    'GoalId'
                ],
                'ReportName': f'RSY Platforms {period_name}',
                'ReportType': 'CUSTOM_REPORT',
                'DateRangeType': 'CUSTOM_DATE',
                'Format': 'TSV',
                'IncludeVAT': 'NO',
                'IncludeDiscount': 'NO'
            }
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            
            if response.status_code != 200:
                print(f'❌ API error for {period_name}: {response.status_code} - {response.text[:200]}')
                continue
            
            lines = response.text.strip().split('\n')
            if len(lines) < 2:
                continue
            
            # Парсим данные за период
            for line in lines[1:]:
                values = line.split('\t')
                if len(values) < 7:
                    continue
                
                placement = values[1]
                goal_id = values[6]
                
                # Учитываем только выбранные цели
                if goal_id not in selected_goal_ids and goal_id != '--':
                    continue
                
                # Дедупликация: суммируем данные по домену
                if placement not in all_platforms:
                    all_platforms[placement] = {
                        'domain': placement,
                        'impressions': 0,
                        'clicks': 0,
                        'cost': 0.0,
                        'conversions': 0,
                        'campaigns': set()
                    }
                
                all_platforms[placement]['impressions'] += int(values[2]) if values[2] != '--' else 0
                all_platforms[placement]['clicks'] += int(values[3]) if values[3] != '--' else 0
                all_platforms[placement]['cost'] += float(values[4]) if values[4] != '--' else 0.0
                all_platforms[placement]['conversions'] += int(values[5]) if values[5] != '--' else 0
                all_platforms[placement]['campaigns'].add(values[0])
        
        except Exception as e:
            print(f'⚠️  Error fetching {period_name}: {str(e)}')
            continue
    
    # Анализируем собранные данные
    to_block = []
    to_keep = []
    total_savings = 0
    
    for domain, stats in all_platforms.items():
        ctr = (stats['clicks'] / stats['impressions'] * 100) if stats['impressions'] > 0 else 0
        cpa = (stats['cost'] / stats['conversions']) if stats['conversions'] > 0 else 0
        
        # Проверка на whitelist (точное совпадение)
        is_whitelisted = domain.lower() in [wl.lower() for wl in whitelist_exact]
        
        # Проверка на мусорные паттерны
        is_trash = any(pattern in domain.lower() for pattern in trash_patterns) and not is_whitelisted
        
        reasons = []
        should_block = False
        
        # Whitelist - всегда оставляем
        if is_whitelisted:
            to_keep.append({
                'domain': domain,
                'cost': stats['cost'],
                'ctr': round(ctr, 2),
                'conversions': stats['conversions'],
                'cpa': round(cpa, 2) if cpa > 0 else 0,
                'reason': 'Whitelist'
            })
            continue
        
        # Правило 1: Мусорные домены
        if is_trash:
            should_block = True
            reasons.append('Мусорный домен')
        
        # Правило 2: CTR > 2% но 0 конверсий
        if ctr > 2.0 and stats['conversions'] == 0:
            should_block = True
            reasons.append(f'CTR {ctr:.2f}% но 0 конверсий')
        
        # Правило 3: CPA выше целевого
        if stats['conversions'] > 0 and cpa > target_cpa:
            should_block = True
            reasons.append(f'CPA {cpa:.2f}₽ > целевой {target_cpa}₽')
        
        if should_block:
            to_block.append({
                'domain': domain,
                'cost': stats['cost'],
                'ctr': round(ctr, 2),
                'clicks': stats['clicks'],
                'conversions': stats['conversions'],
                'cpa': round(cpa, 2) if cpa > 0 else 0,
                'reason': ' | '.join(reasons)
            })
            total_savings += stats['cost']
        else:
            # Хорошие площадки
            if stats['conversions'] > 0 or ctr > 1.0:
                to_keep.append({
                    'domain': domain,
                    'cost': stats['cost'],
                    'ctr': round(ctr, 2),
                    'conversions': stats['conversions'],
                    'cpa': round(cpa, 2) if cpa > 0 else 0,
                    'reason': f'{stats["conversions"]} конв., CTR {ctr:.2f}%'
                })
    
    to_block.sort(key=lambda x: x['cost'], reverse=True)
    to_keep.sort(key=lambda x: x['cost'], reverse=True)
    
    return {
        'total_analyzed': len(all_platforms),
        'to_block': to_block,
        'to_keep': to_keep[:20],
        'total_savings': round(total_savings, 2),
        'blocked_by_reason': {
            'trash_domains': len([p for p in to_block if 'Мусорный домен' in p['reason']]),
            'high_ctr_no_conv': len([p for p in to_block if 'CTR' in p['reason'] and '0 конверсий' in p['reason']]),
            'high_cpa': len([p for p in to_block if 'CPA' in p['reason'] and '>' in p['reason']])
        }
    }


def error_response(message: str) -> Dict:
    '''Возвращает ошибку'''
    return {
        'statusCode': 500,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }