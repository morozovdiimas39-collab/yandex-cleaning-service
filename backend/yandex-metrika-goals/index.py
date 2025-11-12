import json
import os
import requests
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение целей из Яндекс.Метрики для заданных счетчиков
    Args: event - dict with httpMethod, body (counter_ids), headers (X-Auth-Token)
          context - object with request_id attribute
    Returns: HTTP response with goals data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers_raw = event.get('headers', {})
    token = headers_raw.get('X-Auth-Token') or headers_raw.get('x-auth-token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-Auth-Token header required'})
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    try:
        body_data = json.loads(body_str)
        counter_ids = body_data.get('counter_ids', [])
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    
    if not counter_ids:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'counter_ids required in request body'})
        }
    
    all_goals = []
    
    for counter_id in counter_ids:
        try:
            headers_api = {
                'Authorization': f'OAuth {token}',
                'Content-Type': 'application/json'
            }
            
            # Получаем информацию о счетчике (название сайта)
            counter_url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}'
            counter_response = requests.get(counter_url, headers=headers_api, timeout=30)
            
            counter_site = f'Счетчик {counter_id}'
            if counter_response.status_code == 200:
                counter_data = counter_response.json()
                counter_site = counter_data.get('counter', {}).get('site', counter_site)
            
            # Получаем цели счетчика
            goals_url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}/goals'
            response = requests.get(goals_url, headers=headers_api, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                goals = data.get('goals', [])
                
                for goal in goals:
                    all_goals.append({
                        'id': str(goal.get('id')),
                        'name': goal.get('name', 'Без названия'),
                        'counter_id': str(counter_id),
                        'counter_site': counter_site,
                        'type': goal.get('type', 'unknown')
                    })
                    
            elif response.status_code == 401:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid Yandex token'})
                }
            else:
                print(f'⚠️ Failed to get goals for counter {counter_id}: {response.status_code}')
                
        except Exception as e:
            print(f'❌ Error getting goals for counter {counter_id}: {str(e)}')
            continue
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'goals': all_goals})
    }