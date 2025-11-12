import json
import os
import requests
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получает код Cloud Function через Yandex Cloud API
    Args: event - dict с function_id
    Returns: HTTP response с кодом функции
    '''
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    service_account_key = os.environ.get('YANDEX_CLOUD_SERVICE_ACCOUNT_KEY')
    if not service_account_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'YANDEX_CLOUD_SERVICE_ACCOUNT_KEY not configured'})
        }
    
    try:
        key_data = json.loads(service_account_key)
        
        # Получаем IAM токен
        iam_response = requests.post(
            'https://iam.api.cloud.yandex.net/iam/v1/tokens',
            json={'jwt': create_jwt(key_data)},
            timeout=10
        )
        
        if iam_response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'IAM token error: {iam_response.text}'})
            }
        
        iam_token = iam_response.json()['iamToken']
        
        # Получаем список функций
        functions_response = requests.get(
            'https://serverless-functions.api.cloud.yandex.net/functions/v1/functions',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'folderId': 'b1gtcrip05he61994ldo'},
            timeout=10
        )
        
        if functions_response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Functions API error: {functions_response.text}'})
            }
        
        functions = functions_response.json().get('functions', [])
        
        # Находим rsya-scheduler
        scheduler_func = None
        for func in functions:
            if func['name'] == 'rsya-scheduler':
                scheduler_func = func
                break
        
        if not scheduler_func:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'rsya-scheduler function not found'})
            }
        
        # Получаем последнюю версию функции
        version_response = requests.get(
            f"https://serverless-functions.api.cloud.yandex.net/functions/v1/versions:byTag",
            headers={'Authorization': f'Bearer {iam_token}'},
            params={
                'functionId': scheduler_func['id'],
                'tag': '$latest'
            },
            timeout=10
        )
        
        if version_response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Version API error: {version_response.text}'})
            }
        
        version_data = version_response.json()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'function_id': scheduler_func['id'],
                'version_id': version_data.get('id'),
                'runtime': version_data.get('runtime'),
                'entrypoint': version_data.get('entrypoint'),
                'resources': version_data.get('resources'),
                'environment': version_data.get('environment', {}),
                'content': version_data.get('content', {})
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def create_jwt(key_data: Dict[str, Any]) -> str:
    '''Создает JWT для получения IAM токена'''
    import time
    import jwt
    
    now = int(time.time())
    payload = {
        'aud': 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        'iss': key_data['service_account_id'],
        'iat': now,
        'exp': now + 360
    }
    
    return jwt.encode(
        payload,
        key_data['private_key'],
        algorithm='PS256',
        headers={'kid': key_data['id']}
    )
