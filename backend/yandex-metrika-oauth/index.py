import json
import os
import psycopg2
import requests
from urllib.parse import urlencode

CLIENT_ID = os.environ.get('YANDEX_METRIKA_OAUTH_CLIENT_ID', '')
CLIENT_SECRET = os.environ.get('YANDEX_METRIKA_OAUTH_CLIENT_SECRET', '')
REDIRECT_URI = 'https://oauth.yandex.ru/verification_code'

def handler(event: dict, context) -> dict:
    '''
    OAuth для Яндекс.Метрики через device flow (verification_code)
    '''
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    
    if method == 'OPTIONS':
        return cors_response(200, '')
    
    if method == 'POST':
        return handle_token_exchange(event)
    
    project_id = params.get('project_id')
    if not project_id:
        return cors_response(400, json.dumps({'error': 'project_id required'}))
    
    return show_auth_page(project_id)


def show_auth_page(project_id: str) -> dict:
    '''Страница с инструкцией по OAuth через device flow'''
    auth_url = 'https://oauth.yandex.ru/authorize?' + urlencode({
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'device_id': f'project_{project_id}',
        'device_name': 'TelegaCRM'
    })
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Подключение Метрики</title>
        <style>
            body {{ font-family: system-ui; max-width: 500px; margin: 100px auto; padding: 20px; }}
            .step {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            h1 {{ color: #0f172a; text-align: center; }}
            input {{ width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 16px; box-sizing: border-box; }}
            button {{ background: #3b82f6; color: white; border: none; padding: 12px 24px; 
                     border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 10px; }}
            button:hover {{ background: #2563eb; }}
            #result {{ margin-top: 20px; padding: 12px; border-radius: 6px; display: none; }}
        </style>
    </head>
    <body>
        <h1>Подключение Яндекс.Метрики</h1>
        
        <div class="step">
            <h3>Шаг 1: Получите код</h3>
            <p style="color: #64748b; font-size: 14px;">Нажмите кнопку, авторизуйтесь и разрешите доступ</p>
            <a href="{auth_url}" target="_blank">
                <button type="button">Открыть Яндекс OAuth</button>
            </a>
        </div>
        
        <div class="step">
            <h3>Шаг 2: Введите код подтверждения</h3>
            <p style="color: #64748b; font-size: 14px;">Скопируйте код с страницы Яндекса и вставьте сюда</p>
            <form id="codeForm">
                <input type="text" id="code" placeholder="Вставьте код" required />
                <button type="submit">Подключить</button>
            </form>
        </div>
        
        <div id="result"></div>
        
        <script>
        document.getElementById('codeForm').onsubmit = async (e) => {{
            e.preventDefault();
            const code = document.getElementById('code').value;
            const result = document.getElementById('result');
            
            result.style.display = 'block';
            result.style.background = '#f1f5f9';
            result.style.color = '#475569';
            result.textContent = 'Подключаю...';
            
            try {{
                const res = await fetch(window.location.href, {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{code: code, project_id: '{project_id}'}})
                }});
                
                const data = await res.json();
                
                if (res.ok && data.success) {{
                    result.style.background = '#dcfce7';
                    result.style.color = '#166534';
                    result.textContent = '✅ Метрика подключена! Закройте это окно.';
                    setTimeout(() => window.close(), 2000);
                }} else {{
                    result.style.background = '#fee2e2';
                    result.style.color = '#991b1b';
                    result.textContent = '❌ Ошибка: ' + (data.error || 'Неизвестная ошибка');
                }}
            }} catch (err) {{
                result.style.background = '#fee2e2';
                result.style.color = '#991b1b';
                result.textContent = '❌ Ошибка соединения';
            }}
        }};
        </script>
    </body>
    </html>
    '''
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        },
        'body': html,
        'isBase64Encoded': False
    }


def handle_token_exchange(event: dict) -> dict:
    '''Обмен кода на токен'''
    try:
        body = json.loads(event.get('body', '{}'))
        code = body.get('code')
        project_id = body.get('project_id')
        
        if not code or not project_id:
            return json_response(400, {'error': 'code и project_id обязательны'})
        
        token_response = requests.post('https://oauth.yandex.ru/token', data={
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }, timeout=10)
        
        token_data = token_response.json()
        
        if 'access_token' not in token_data:
            print(f'Token error: {token_data}')
            return json_response(400, {'error': f'Ошибка токена: {token_data.get("error_description", "unknown")}'})
        
        access_token = token_data['access_token']
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return json_response(500, {'error': 'DATABASE_URL not configured'})
        
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute('''
            UPDATE t_p97630513_yandex_cleaning_serv.telega_crm_projects
            SET yandex_metrika_token = %s
            WHERE id = %s
            RETURNING id
        ''', (access_token, project_id))
        
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return json_response(404, {'error': 'Проект не найден'})
        
        cur.close()
        conn.close()
        
        return json_response(200, {'success': True})
        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        print(traceback.format_exc())
        return json_response(500, {'error': str(e)})


def json_response(status: int, data: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data),
        'isBase64Encoded': False
    }


def cors_response(status: int, body: str) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': body,
        'isBase64Encoded': False
    }
