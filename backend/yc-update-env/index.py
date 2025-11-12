import json
import os
import requests
import time
import jwt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обновление переменных окружения функции yc-debug
    Args: event - dict
    Returns: Результат обновления
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
    
    try:
        # SA ключ который нужно добавить в yc-debug
        sa_key_to_add = '''{
  "id": "ajeljoju0s3fnd7t743c",
  "service_account_id": "ajea2cc4hqoj479l4393",
  "created_at": "2025-11-12T17:00:40.366081299Z",
  "key_algorithm": "RSA_2048",
  "public_key": "-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuuZsrhawJwOj9R4GoMNG\\nU7hExtTw51ImZQzvUAymfGpvAUhjOlKnBZbwekGSE8rjY7gR3/YiJQpq5gl3yLdG\\nhOUfdtRDOffzdaXPmNVe88gWG+pd0L4crk4nETECYfjob5npCG2F/mnkgARtG8dH\\nUWAFFJyNLXaHDJKZy7CIEwdCfvKuM2j24v5jkH4WJTSur31RAVKua8lCrt4hZ8gn\\nUkZO99Qr04kdrjEfsGlKb1kuwuzkLb4M0RW85kyBlyL1oHlyOWT3XR+RYjBHYBZT\\nMRDlVLFcHwoXbPbfBmTWHgPWtM9GJqqOHIohrgRzxE7KrY0bnATlFlMnnCcmWD5s\\newIDAQAB\\n-----END PUBLIC KEY-----\\n",
  "private_key": "PLEASE DO NOT REMOVE THIS LINE! Yandex.Cloud SA Key ID <ajeljoju0s3fnd7t743c>\\n-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC65myuFrAnA6P1\\nHgagw0ZTuETG1PDnUiZlDO9QDKZ8am8BSGM6UqcFlvB6QZITyuNjuBHf9iIlCmrm\\nCXfIt0aE5R921EM59/N1pc+Y1V7zyBYb6l3QvhyuTicRMQJh+OhvmekIbYX+aeSA\\nBG0bx0dRYAUUnI0tdocMkpnLsIgTB0J+8q4zaPbi/mOQfhYlNK6vfVEBUq5ryUKu\\n3iFnyCdSRk731CvTiR2uMR+waUpvWS7C7OQtvgzRFbzmTIGXIvWgeXI5ZPddH5Fi\\nMEdgFlMxEOVUsVwfChds9t8GZNYeA9a0z0Ymqo4ciiGuBHPETsqtjRucBOUWUyec\\nJyZYPmx7AgMBAAECggEAA92v+wjE/wUnUB2A8CY/O6je8RqcKUhSHqjeHNKcYzbF\\ngEMDjm7Ir4uGO459jVGW/b2q6zVQi2HuugW8AJ7N43Py8g3MEDDYaL+iAGOx7g4z\\n3KaEICihOAYDC2sLtvXcfBS0pqzr9OaknZ+50Hyr0dDQCFAOrtyPSK88utULr/Xt\\nmRnFqSushwcbpHl8F2oou8/IjJH7tD8KBQaJdBIPxFez45jJbA6ypk6s/mHD5RI/\\n9FuAS68y7cnvpcum91Hpbanb4kI4yex2JwRB+edA2jAz2GLy/oQD/fffhXIWyfrk\\n5PTvuV4PmW3w4/9+3uix8BUIiWffKa8GbJ8fPctPfQKBgQDWgq92inZNkKDaiW6w\\nOGePTqtaY6DpKLVu6r627tGZdlWR8VdFUNQR/7otKaT/aDN+lWdMR/onb0Sxp9jN\\nEawj0SLkhL/aiHnjjlcdA2ecfncWLZpOisGlZlAMX0YomvXLU4opOxWCI33lIK/B\\nGnPTGDaGpcOiTWv5L3WmLoRopQKBgQDfDKH1JRzvi1xD37Q3NHZk03zXdpjy2H3a\\n83L5IohHTUDBGjW+jq/K1VYwXLiNrdPsjnBkkfYODIlmXBivYBXf1Ujv8hVfMU07\\nnLDusttz+8ntQbFqBn1/swTWiZDXsfgcFuL5Vs18c+I4mQzbVel0AtpEpBfhZLTY\\nJbXhZFJWnwKBgQCOuJytripQKS4cuNvge2bLvnfbx/XDq8YrahxB8luaU1VTqNN7\\n1u+Cmjbw3YheNqIsUpNL+YfCvRFjcl2Y820o13jzui874xnWAVqMfztsr+fj5auJ\\nHmEA/zW7RZiUY6WuBoMiM6F32M1mqXzGaicuCCofJCMp1YFFZgJM8x490QKBgD00\\n+jyLMqWJWIhHmuyLOPHyFxAJO29oeSDcLXCwSTVHvb0/s//Wp+bBJCWhTAOU79K6\\nQ51VcG/qgMnV+/AkLdx+asVtaO/2V3tEREk8S3xIW+D/Ze/yV/3y4iD9HwIRlEQh\\nA6foafr80dc2KJEHwkhTgBHV9bekKvwlXQO8w9uBAoGAT6sZjXG2GNYPMqoq/S1q\\n92OjwmwfbAmNNLgeEcrpsunlyi78MaW544r0WUXMN+rlnD2+ABx+rneoNhSBEFee\\n0u5fYT/A1GZ9/ILCIBd2WD3eaA1ku74Ynw5n5p5eHM9+3fBgd87EgqEWjMaCTqPe\\n12knMTH374vx8HMWjtkmvOQ=\\n-----END PRIVATE KEY-----\\n"
}'''
        
        key_data = json.loads(sa_key_to_add)
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
        
        # Ищем yc-debug
        yc_debug_id = None
        for func in functions:
            if func['name'] == 'yc-debug':
                yc_debug_id = func['id']
                break
        
        if not yc_debug_id:
            return error_response('yc-debug function not found')
        
        # Получаем текущую версию функции
        version_resp = requests.get(
            f'https://serverless-functions.api.cloud.yandex.net/functions/v1/versions:byTag',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'functionId': yc_debug_id, 'tag': '$latest'},
            timeout=10
        )
        
        if version_resp.status_code != 200:
            return error_response(f'Version API error: {version_resp.text}')
        
        current_version = version_resp.json()
        
        # Создаем новую версию с обновленными env переменными
        new_env = current_version.get('environment', {})
        new_env['YANDEX_CLOUD_SERVICE_ACCOUNT_KEY'] = sa_key_to_add
        
        create_version_payload = {
            'functionId': yc_debug_id,
            'runtime': current_version['runtime'],
            'entrypoint': current_version['entrypoint'],
            'resources': current_version['resources'],
            'executionTimeout': current_version['executionTimeout'],
            'serviceAccountId': current_version.get('serviceAccountId'),
            'environment': new_env,
            'content': {
                'zipFilename': 'function.zip'
            }
        }
        
        create_resp = requests.post(
            'https://serverless-functions.api.cloud.yandex.net/functions/v1/versions',
            headers={'Authorization': f'Bearer {iam_token}', 'Content-Type': 'application/json'},
            json=create_version_payload,
            timeout=30
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': create_resp.status_code == 200,
                'yc_debug_id': yc_debug_id,
                'response': create_resp.text
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
