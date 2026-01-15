import json
import os
import psycopg2
import requests
from urllib.parse import urlencode

CLIENT_ID = os.environ.get('YANDEX_METRIKA_OAUTH_CLIENT_ID', '')
CLIENT_SECRET = os.environ.get('YANDEX_METRIKA_OAUTH_CLIENT_SECRET', '')
REDIRECT_URI = 'https://functions.poehali.dev/61ff1445-d92e-4f1f-9900-fe5b339f3e56/callback'

def handler(event: dict, context) -> dict:
    '''
    OAuth-поток для получения токена Яндекс.Метрики
    '''
    method = event.get('httpMethod', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    
    if method == 'OPTIONS':
        return cors_response(200, '')
    
    if '/callback' in path:
        return handle_callback(event)
    
    return handle_auth_start(event)


def handle_auth_start(event: dict) -> dict:
    '''Начало OAuth-потока: редирект на Яндекс'''
    params = event.get('queryStringParameters') or {}
    project_id = params.get('project_id')
    
    if not project_id:
        return cors_response(400, json.dumps({'error': 'project_id required'}))
    
    auth_url = 'https://oauth.yandex.ru/authorize?' + urlencode({
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'state': project_id,
        'force_confirm': 'yes'
    })
    
    return {
        'statusCode': 302,
        'headers': {
            'Location': auth_url,
            'Access-Control-Allow-Origin': '*'
        },
        'body': '',
        'isBase64Encoded': False
    }


def handle_callback(event: dict) -> dict:
    '''Обработка callback от Яндекса: обмен code на token'''
    params = event.get('queryStringParameters') or {}
    code = params.get('code')
    project_id = params.get('state')
    
    if not code or not project_id:
        return error_page('Ошибка авторизации: нет code или project_id')
    
    try:
        token_response = requests.post('https://oauth.yandex.ru/token', data={
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }, timeout=10)
        
        token_data = token_response.json()
        
        if 'access_token' not in token_data:
            return error_page(f'Ошибка получения токена: {token_data}')
        
        access_token = token_data['access_token']
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return error_page('DATABASE_URL not configured')
        
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
            return error_page('Проект не найден')
        
        cur.close()
        conn.close()
        
        return success_page()
        
    except Exception as e:
        print(f'Error: {e}')
        return error_page(f'Ошибка: {str(e)}')


def success_page() -> dict:
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Метрика подключена</title>
        <style>
            body { font-family: system-ui; max-width: 500px; margin: 100px auto; text-align: center; }
            .success { color: #059669; font-size: 64px; }
            h1 { color: #0f172a; }
            p { color: #64748b; }
            button { background: #059669; color: white; border: none; padding: 12px 24px; 
                     border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="success">✅</div>
        <h1>Яндекс.Метрика подключена!</h1>
        <p>Теперь конверсии будут автоматически отправляться в Метрику, а цели создадутся автоматически.</p>
        <button onclick="window.close()">Закрыть окно</button>
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


def error_page(message: str) -> dict:
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ошибка</title>
        <style>
            body {{ font-family: system-ui; max-width: 500px; margin: 100px auto; text-align: center; }}
            .error {{ color: #dc2626; font-size: 64px; }}
            h1 {{ color: #0f172a; }}
            p {{ color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="error">❌</div>
        <h1>Ошибка подключения</h1>
        <p>{message}</p>
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


def cors_response(status: int, body: str) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': body,
        'isBase64Encoded': False
    }