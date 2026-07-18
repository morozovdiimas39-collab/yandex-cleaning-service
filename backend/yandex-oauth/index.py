import json
import os
from typing import Dict, Any
import requests
from urllib.parse import urlencode

DEFAULT_REDIRECT_URI = 'https://functions.yandexcloud.net/d4enntdqk6omuagvamph'

def response(status_code: int, body: str, content_type: str = 'application/json') -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': content_type,
            'Access-Control-Allow-Origin': '*'
        },
        'body': body,
        'isBase64Encoded': False
    }

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
        redirect_uri = os.environ.get('YANDEX_OAUTH_REDIRECT_URI', DEFAULT_REDIRECT_URI)
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri
        }
        
        print(f'[YANDEX_OAUTH] Exchanging code for token...')
        
        token_response = requests.post(token_url, data=token_data, timeout=30)
        
        if token_response.status_code != 200:
            print(f'[YANDEX_OAUTH] Token exchange failed: {token_response.text}')
            error_html = f'''
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="utf-8"><title>Ошибка авторизации</title></head>
            <body>
                <script>
                    if (window.opener) {{
                        window.opener.postMessage({{
                            type: 'yandex_oauth_error',
                            error: {json.dumps(token_response.text)}
                        }}, '*');
                    }}
                </script>
                <h2>Не удалось авторизоваться в Яндексе</h2>
                <p>Закройте окно и попробуйте ещё раз.</p>
            </body>
            </html>
            '''
            return response(token_response.status_code, error_html, 'text/html')
        
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
        
        print(f'[YANDEX_OAUTH] Token received, login: {yandex_login}, state: {state}')
        
        success_html = f'''
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="utf-8">
            <title>Авторизация успешна</title>
            <style>
                body {{
                    margin: 0;
                    min-height: 100vh;
                    display: grid;
                    place-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    color: #0f172a;
                    background: #f8fafc;
                }}
                .card {{
                    max-width: 420px;
                    padding: 32px;
                    border: 1px solid #dbe5ee;
                    border-radius: 24px;
                    background: white;
                    text-align: center;
                    box-shadow: 0 18px 60px rgba(15, 23, 42, .08);
                }}
                .icon {{
                    width: 56px;
                    height: 56px;
                    margin: 0 auto 16px;
                    border-radius: 18px;
                    background: #16a34a;
                    color: white;
                    display: grid;
                    place-items: center;
                    font-size: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">✓</div>
                <h2>Авторизация успешна</h2>
                <p>Возвращаем доступ в DirectKit.</p>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'yandex_oauth_token',
                        token: {json.dumps(access_token)},
                        refreshToken: {json.dumps(refresh_token)},
                        expiresIn: {json.dumps(expires_in)},
                        yandexLogin: {json.dumps(yandex_login)},
                        state: {json.dumps(state)}
                    }}, '*');
                    window.close();
                }} else {{
                    setTimeout(() => window.close(), 2000);
                }}
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
            
            redirect_uri = os.environ.get('YANDEX_OAUTH_REDIRECT_URI', DEFAULT_REDIRECT_URI)
            auth_url = 'https://oauth.yandex.ru/authorize?' + urlencode({
                'response_type': 'code',
                'client_id': client_id,
                'state': user_id,
                'redirect_uri': redirect_uri,
                'force_confirm': 'yes'
            })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'auth_url': auth_url}),
                'isBase64Encoded': False
            }
        
        return response(400, json.dumps({'error': 'Unsupported action'}))
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
