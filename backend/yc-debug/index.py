import json
import os
import requests
import time
import jwt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проверка Yandex Cloud триггеров и функций
    Args: event - dict
    Returns: Информация о триггерах и функциях
    '''
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        # Получаем IAM токен
        sa_key = os.environ.get('YANDEX_CLOUD_SERVICE_ACCOUNT_KEY')
        if not sa_key:
            return error_response('YANDEX_CLOUD_SERVICE_ACCOUNT_KEY not set')
        
        key_data = json.loads(sa_key)
        iam_token = get_iam_token(key_data)
        
        folder_id = 'b1gtcrip05he61994ldo'
        
        # Получаем список функций
        functions_resp = requests.get(
            'https://serverless-functions.api.cloud.yandex.net/functions/v1/functions',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'folderId': folder_id},
            timeout=10
        )
        
        if functions_resp.status_code != 200:
            return error_response(f'Functions API error: {functions_resp.text}')
        
        functions = functions_resp.json().get('functions', [])
        
        # Ищем rsya функции
        scheduler_id = None
        worker_id = None
        for func in functions:
            if func['name'] == 'rsya-scheduler':
                scheduler_id = func['id']
            elif func['name'] == 'rsya-batch-worker':
                worker_id = func['id']
        
        # Получаем триггеры
        triggers_resp = requests.get(
            'https://serverless-triggers.api.cloud.yandex.net/triggers/v1/triggers',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'folderId': folder_id},
            timeout=10
        )
        
        if triggers_resp.status_code != 200:
            return error_response(f'Triggers API error: {triggers_resp.text}')
        
        triggers = triggers_resp.json().get('triggers', [])
        
        # Фильтруем триггеры для наших функций
        relevant_triggers = []
        for trigger in triggers:
            rule = trigger.get('rule', {})
            func_id = None
            trigger_type = None
            trigger_details = {}
            
            if 'timer' in rule:
                func_id = rule['timer'].get('invokeFunction', {}).get('functionId')
                trigger_type = 'CRON'
                trigger_details = {
                    'cron_expression': rule['timer'].get('cronExpression'),
                    'payload': rule['timer'].get('invokeFunction', {}).get('payload')
                }
            elif 'messageQueue' in rule:
                func_id = rule['messageQueue'].get('invokeFunction', {}).get('functionId')
                trigger_type = 'MessageQueue'
                trigger_details = {
                    'queue_id': rule['messageQueue'].get('queueId'),
                    'service_account_id': rule['messageQueue'].get('serviceAccountId'),
                    'batch_size': rule['messageQueue'].get('batchSettings', {}).get('size'),
                    'batch_cutoff': rule['messageQueue'].get('batchSettings', {}).get('cutoff')
                }
            
            if func_id in [scheduler_id, worker_id]:
                relevant_triggers.append({
                    'id': trigger.get('id'),
                    'name': trigger.get('name'),
                    'type': trigger_type,
                    'status': trigger.get('status'),
                    'function_id': func_id,
                    'function_name': 'rsya-scheduler' if func_id == scheduler_id else 'rsya-batch-worker',
                    'details': trigger_details
                })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'scheduler_id': scheduler_id,
                'worker_id': worker_id,
                'triggers': relevant_triggers,
                'total_functions': len(functions),
                'total_triggers': len(triggers)
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return error_response(str(e))


def get_iam_token(key_data: Dict[str, Any]) -> str:
    '''Получает IAM токен через JWT'''
    now = int(time.time())
    payload = {
        'aud': 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        'iss': key_data['service_account_id'],
        'iat': now,
        'exp': now + 360
    }
    
    encoded_token = jwt.encode(
        payload,
        key_data['private_key'],
        algorithm='PS256',
        headers={'kid': key_data['id']}
    )
    
    resp = requests.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        json={'jwt': encoded_token},
        timeout=10
    )
    
    if resp.status_code != 200:
        raise Exception(f'IAM token error: {resp.text}')
    
    return resp.json()['iamToken']


def error_response(message: str) -> Dict[str, Any]:
    return {
        'statusCode': 500,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message})
    }
