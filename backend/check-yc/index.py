import json
import os
import requests
import time
import jwt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проверка состояния Yandex Cloud для РСЯ
    Args: event - dict
    Returns: Полная диагностика триггеров, очередей и функций
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
        # Hardcoded SA key
        sa_key_json = '''{
  "id": "ajeljoju0s3fnd7t743c",
  "service_account_id": "ajea2cc4hqoj479l4393",
  "created_at": "2025-11-12T17:00:40.366081299Z",
  "key_algorithm": "RSA_2048",
  "public_key": "-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuuZsrhawJwOj9R4GoMNG\\nU7hExtTw51ImZQzvUAymfGpvAUhjOlKnBZbwekGSE8rjY7gR3/YiJQpq5gl3yLdG\\nhOUfdtRDOffzdaXPmNVe88gWG+pd0L4crk4nETECYfjob5npCG2F/mnkgARtG8dH\\nUWAFFJyNLXaHDJKZy7CIEwdCfvKuM2j24v5jkH4WJTSur31RAVKua8lCrt4hZ8gn\\nUkZO99Qr04kdrjEfsGlKb1kuwuzkLb4M0RW85kyBlyL1oHlyOWT3XR+RYjBHYBZT\\nMRDlVLFcHwoXbPbfBmTWHgPWtM9GJqqOHIohrgRzxE7KrY0bnATlFlMnnCcmWD5s\\newIDAQAB\\n-----END PUBLIC KEY-----\\n",
  "private_key": "PLEASE DO NOT REMOVE THIS LINE! Yandex.Cloud SA Key ID <ajeljoju0s3fnd7t743c>\\n-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC65myuFrAnA6P1\\nHgagw0ZTuETG1PDnUiZlDO9QDKZ8am8BSGM6UqcFlvB6QZITyuNjuBHf9iIlCmrm\\nCXfIt0aE5R921EM59/N1pc+Y1V7zyBYb6l3QvhyuTicRMQJh+OhvmekIbYX+aeSA\\nBG0bx0dRYAUUnI0tdocMkpnLsIgTB0J+8q4zaPbi/mOQfhYlNK6vfVEBUq5ryUKu\\n3iFnyCdSRk731CvTiR2uMR+waUpvWS7C7OQtvgzRFbzmTIGXIvWgeXI5ZPddH5Fi\\nMEdgFlMxEOVUsVwfChds9t8GZNYeA9a0z0Ymqo4ciiGuBHPETsqtjRucBOUWUyec\\nJyZYPmx7AgMBAAECggEAA92v+wjE/wUnUB2A8CY/O6je8RqcKUhSHqjeHNKcYzbF\\ngEMDjm7Ir4uGO459jVGW/b2q6zVQi2HuugW8AJ7N43Py8g3MEDDYaL+iAGOx7g4z\\n3KaEICihOAYDC2sLtvXcfBS0pqzr9OaknZ+50Hyr0dDQCFAOrtyPSK88utULr/Xt\\nmRnFqSushwcbpHl8F2oou8/IjJH7tD8KBQaJdBIPxFez45jJbA6ypk6s/mHD5RI/\\n9FuAS68y7cnvpcum91Hpbanb4kI4yex2JwRB+edA2jAz2GLy/oQD/fffhXIWyfrk\\n5PTvuV4PmW3w4/9+3uix8BUIiWffKa8GbJ8fPctPfQKBgQDWgq92inZNkKDaiW6w\\nOGePTqtaY6DpKLVu6r627tGZdlWR8VdFUNQR/7otKaT/aDN+lWdMR/onb0Sxp9jN\\nEawj0SLkhL/aiHnjjlcdA2ecfncWLZpOisGlZlAMX0YomvXLU4opOxWCI33lIK/B\\nGnPTGDaGpcOiTWv5L3WmLoRopQKBgQDfDKH1JRzvi1xD37Q3NHZk03zXdpjy2H3a\\n83L5IohHTUDBGjW+jq/K1VYwXLiNrdPsjnBkkfYODIlmXBivYBXf1Ujv8hVfMU07\\nnLDusttz+8ntQbFqBn1/swTWiZDXsfgcFuL5Vs18c+I4mQzbVel0AtpEpBfhZLTY\\nJbXhZFJWnwKBgQCOuJytripQKS4cuNvge2bLvnfbx/XDq8YrahxB8luaU1VTqNN7\\n1u+Cmjbw3YheNqIsUpNL+YfCvRFjcl2Y820o13jzui874xnWAVqMfztsr+fj5auJ\\nHmEA/zW7RZiUY6WuBoMiM6F32M1mqXzGaicuCCofJCMp1YFFZgJM8x490QKBgD00\\n+jyLMqWJWIhHmuyLOPHyFxAJO29oeSDcLXCwSTVHvb0/s//Wp+bBJCWhTAOU79K6\\nQ51VcG/qgMnV+/AkLdx+asVtaO/2V3tEREk8S3xIW+D/Ze/yV/3y4iD9HwIRlEQh\\nA6foafr80dc2KJEHwkhTgBHV9bekKvwlXQO8w9uBAoGAT6sZjXG2GNYPMqoq/S1q\\n92OjwmwfbAmNNLgeEcrpsunlyi78MaW544r0WUXMN+rlnD2+ABx+rneoNhSBEFee\\n0u5fYT/A1GZ9/ILCIBd2WD3eaA1ku74Ynw5n5p5eHM9+3fBgd87EgqEWjMaCTqPe\\n12knMTH374vx8HMWjtkmvOQ=\\n-----END PRIVATE KEY-----\\n"
}'''
        
        key_data = json.loads(sa_key_json)
        iam_token = get_iam_token(key_data)
        
        folder_id = 'b1gfge7vvmv0dmokngu5'
        
        report = {}
        
        # 1. Получаем список функций
        functions_resp = requests.get(
            'https://serverless-functions.api.cloud.yandex.net/functions/v1/functions',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'folderId': folder_id},
            timeout=10
        )
        
        if functions_resp.status_code != 200:
            report['functions_error'] = functions_resp.text
        else:
            functions = functions_resp.json().get('functions', [])
            scheduler_func = None
            worker_func = None
            
            for func in functions:
                if func['name'] == 'rsya-scheduler':
                    scheduler_func = func
                elif func['name'] == 'rsya-batch-worker':
                    worker_func = func
            
            # Получаем детали версии функции rsya-scheduler
            scheduler_details = None
            if scheduler_func:
                try:
                    version_resp = requests.get(
                        f"https://serverless-functions.api.cloud.yandex.net/functions/v1/versions:byTag",
                        headers={'Authorization': f'Bearer {iam_token}'},
                        params={
                            'functionId': scheduler_func['id'],
                            'tag': '$latest'
                        },
                        timeout=10
                    )
                    if version_resp.status_code == 200:
                        version_data = version_resp.json()
                        scheduler_details = {
                            'service_account_id': version_data.get('serviceAccountId'),
                            'version_id': version_data.get('id'),
                            'runtime': version_data.get('runtime'),
                            'entrypoint': version_data.get('entrypoint'),
                            'environment': version_data.get('environment', {})
                        }
                except Exception as e:
                    report['scheduler_version_error'] = str(e)
            
            report['functions'] = {
                'total': len(functions),
                'scheduler': {
                    'exists': scheduler_func is not None,
                    'id': scheduler_func['id'] if scheduler_func else None,
                    'status': scheduler_func.get('status') if scheduler_func else None,
                    'details': scheduler_details
                },
                'worker': {
                    'exists': worker_func is not None,
                    'id': worker_func['id'] if worker_func else None,
                    'status': worker_func.get('status') if worker_func else None
                }
            }
        
        # 2. Получаем триггеры
        triggers_resp = requests.get(
            'https://serverless-triggers.api.cloud.yandex.net/triggers/v1/triggers',
            headers={'Authorization': f'Bearer {iam_token}'},
            params={'folderId': folder_id},
            timeout=10
        )
        
        if triggers_resp.status_code != 200:
            report['triggers_error'] = triggers_resp.text
        else:
            triggers = triggers_resp.json().get('triggers', [])
            
            cron_trigger = None
            mq_trigger = None
            
            for trigger in triggers:
                rule = trigger.get('rule', {})
                
                if 'timer' in rule:
                    func_id = rule['timer'].get('invokeFunction', {}).get('functionId')
                    if func_id == report['functions']['scheduler']['id']:
                        cron_trigger = {
                            'id': trigger['id'],
                            'name': trigger['name'],
                            'status': trigger['status'],
                            'cron': rule['timer'].get('cronExpression')
                        }
                
                if 'messageQueue' in rule:
                    func_id = rule['messageQueue'].get('invokeFunction', {}).get('functionId')
                    if func_id == report['functions']['worker']['id']:
                        mq_trigger = {
                            'id': trigger['id'],
                            'name': trigger['name'],
                            'status': trigger['status'],
                            'queue_id': rule['messageQueue'].get('queueId'),
                            'batch_size': rule['messageQueue'].get('batchSettings', {}).get('size'),
                            'batch_cutoff': rule['messageQueue'].get('batchSettings', {}).get('cutoff')
                        }
            
            report['triggers'] = {
                'total': len(triggers),
                'cron_for_scheduler': cron_trigger,
                'mq_for_worker': mq_trigger
            }
        
        # 3. Получаем информацию о Service Account
        if scheduler_details and scheduler_details.get('service_account_id'):
            sa_id = scheduler_details['service_account_id']
            try:
                # Получаем список сервисных аккаунтов
                sa_resp = requests.get(
                    f'https://iam.api.cloud.yandex.net/iam/v1/serviceAccounts/{sa_id}',
                    headers={'Authorization': f'Bearer {iam_token}'},
                    timeout=10
                )
                
                if sa_resp.status_code == 200:
                    sa_data = sa_resp.json()
                    report['service_account'] = {
                        'id': sa_data.get('id'),
                        'name': sa_data.get('name'),
                        'folder_id': sa_data.get('folderId'),
                        'created_at': sa_data.get('createdAt')
                    }
                else:
                    report['service_account_error'] = f"Failed to get SA: {sa_resp.text}"
                
                # Получаем роли на уровне folder
                access_bindings_resp = requests.get(
                    f'https://resource-manager.api.cloud.yandex.net/resource-manager/v1/folders/{folder_id}:listAccessBindings',
                    headers={'Authorization': f'Bearer {iam_token}'},
                    timeout=10
                )
                
                if access_bindings_resp.status_code == 200:
                    bindings = access_bindings_resp.json().get('accessBindings', [])
                    sa_roles = []
                    for binding in bindings:
                        if binding.get('subject', {}).get('id') == sa_id:
                            sa_roles.append(binding.get('roleId'))
                    
                    report['service_account']['roles'] = sa_roles
                else:
                    report['access_bindings_error'] = f"Failed to list bindings: {access_bindings_resp.text}"
                    
            except Exception as e:
                report['service_account_error'] = str(e)
        
        # 4. Проверяем Message Queue
        mq_access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
        mq_secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
        
        if mq_access_key and mq_secret_key:
            import boto3
            try:
                sqs = boto3.client(
                    'sqs',
                    endpoint_url='https://message-queue.api.cloud.yandex.net',
                    region_name='ru-central1',
                    aws_access_key_id=mq_access_key,
                    aws_secret_access_key=mq_secret_key
                )
                
                queue_url = 'https://message-queue.api.cloud.yandex.net/b1gfge7vvmv0dmokngu5/dj600000007lh09q06il/rsyacleaner'
                
                attrs = sqs.get_queue_attributes(
                    QueueUrl=queue_url,
                    AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
                )
                
                report['message_queue'] = {
                    'queue_url': queue_url,
                    'messages_available': attrs['Attributes'].get('ApproximateNumberOfMessages'),
                    'messages_in_flight': attrs['Attributes'].get('ApproximateNumberOfMessagesNotVisible'),
                    'access_key_id': mq_access_key[:8] + '...'  # Show partial for verification
                }
            except Exception as e:
                report['message_queue_error'] = str(e)
        else:
            report['message_queue_error'] = 'Credentials not found'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(report, ensure_ascii=False, indent=2)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def get_iam_token(key_data: Dict[str, Any]) -> str:
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