import json
import os
from typing import Dict, Any
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка OAuth callback от Яндекса и обмен code на токен
    Args: event с httpMethod (GET/POST), queryStringParameters с code, headers с X-User-Id
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response с access_token или редирект
    '''
    method: str = event.get('httpMethod', 'GET')
    path_params = event.get('pathParams', {})
    path = event.get('url', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters', {})
        code = query_params.get('code')
        state = query_params.get('state')
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Authorization code is required'}),
                'isBase64Encoded': False
            }
        
        client_id = os.environ.get('YANDEX_DIRECT_CLIENT_ID')
        client_secret = os.environ.get('YANDEX_DIRECT_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'OAuth credentials not configured'}),
                'isBase64Encoded': False
            }
        
        token_url = 'https://oauth.yandex.ru/token'
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        print(f'[YANDEX_OAUTH] Exchanging code for token...')
        
        token_response = requests.post(token_url, data=token_data, timeout=30)
        
        if token_response.status_code != 200:
            print(f'[YANDEX_OAUTH] Token exchange failed: {token_response.text}')
            return {
                'statusCode': token_response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Token exchange failed: {token_response.text}'}),
                'isBase64Encoded': False
            }
        
        token_data_response = token_response.json()
        access_token = token_data_response.get('access_token')
        refresh_token = token_data_response.get('refresh_token')
        expires_in = token_data_response.get('expires_in', 31536000)
        
        info_url = 'https://login.yandex.ru/info'
        info_headers = {'Authorization': f'OAuth {access_token}'}
        info_response = requests.get(info_url, headers=info_headers, timeout=30)
        
        yandex_login = None
        if info_response.status_code == 200:
            info_data = info_response.json()
            yandex_login = info_data.get('login')
        
        user_id = state if state else yandex_login
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID not found'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('MY_DATABASE_URL')
        conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        
        expires_at = datetime.now() + timedelta(seconds=expires_in)
        
        cur.execute(
            """
            INSERT INTO yandex_tokens (user_id, access_token, refresh_token, expires_at, yandex_login, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_at = EXCLUDED.expires_at,
                yandex_login = EXCLUDED.yandex_login,
                updated_at = NOW()
            """,
            (user_id, access_token, refresh_token, expires_at, yandex_login)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        print(f'[YANDEX_OAUTH] Token saved for user: {user_id}, login: {yandex_login}')
        
        # Возвращаем HTML страницу которая закроет popup
        success_html = '''
        <!DOCTYPE html>
        <html>
        <head><title>Авторизация успешна</title></head>
        <body>
            <h2>✅ Авторизация успешна!</h2>
            <p>Можете закрыть это окно</p>
            <script>
                if (window.opener) {
                    window.close();
                } else {
                    setTimeout(() => window.close(), 2000);
                }
            </script>
        </body>
        </html>
        '''
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            'body': success_html,
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        headers = event.get('headers', {})
        user_id = headers.get('x-user-id') or headers.get('X-User-Id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID required'}),
                'isBase64Encoded': False
            }
        
        body = event.get('body', '{}')
        try:
            body_data = json.loads(body) if body else {}
        except:
            body_data = {}
        
        if body_data.get('action') == 'auth-url':
            client_id = os.environ.get('YANDEX_DIRECT_CLIENT_ID')
            
            if not client_id:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Client ID not configured'}),
                    'isBase64Encoded': False
                }
            
            redirect_uri = 'https://functions.poehali.dev/052a3544-14b2-4ce8-af5e-26f0e7d0c33a'
            # Запрашиваем права на Директ и Метрику
            scope = 'direct:api metrika:read'
            auth_url = f'https://oauth.yandex.ru/authorize?response_type=code&client_id={client_id}&scope={scope}&state={user_id}'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'auth_url': auth_url}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('MY_DATABASE_URL')
        conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        
        cur.execute(
            "SELECT * FROM yandex_tokens WHERE user_id = %s",
            (user_id,)
        )
        token_record = cur.fetchone()
        cur.close()
        conn.close()
        
        if not token_record:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Token not found', 'connected': False}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'connected': True,
                'access_token': token_record['access_token'],
                'yandex_login': token_record['yandex_login'],
                'expires_at': token_record['expires_at'].isoformat() if token_record['expires_at'] else None
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }