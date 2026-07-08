import json
import os
import time
from typing import Dict, Any, List
import requests

WORDSTAT_API_URL = 'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests'

DEVICE_MAP = {
    'all': 'DEVICE_ALL',
    'desktop': 'DEVICE_DESKTOP',
    'phone': 'DEVICE_PHONE',
    'mobile': 'DEVICE_PHONE',
    'tablet': 'DEVICE_TABLET',
    'DEVICE_ALL': 'DEVICE_ALL',
    'DEVICE_DESKTOP': 'DEVICE_DESKTOP',
    'DEVICE_PHONE': 'DEVICE_PHONE',
    'DEVICE_TABLET': 'DEVICE_TABLET',
}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Парсер Yandex Wordstat для сбора статистики по ключевым фразам
    Args: event с httpMethod, body (keywords: list, regions: list)
    Returns: JSON с данными статистики из Wordstat
    '''
    print(f"[WORDSTAT] Request started. Method: {event.get('httpMethod')}")
    body_preview = event.get('body', '')
    print(f"[WORDSTAT] Body length: {len(body_preview) if body_preview else 0}")
    
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    wordstat_token = os.environ.get('YANDEX_SEARCH_API_KEY') or os.environ.get('YANDEX_WORDSTAT_TOKEN')
    folder_id = os.environ.get('YANDEX_FOLDER_ID')
    if not wordstat_token:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'YANDEX_WORDSTAT_TOKEN not configured'})
        }
    if not folder_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'YANDEX_FOLDER_ID not configured'})
        }
    
    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        
        body_data = json.loads(body_str)
        keywords: List[str] = body_data.get('keywords', [])
        regions: List[int] = body_data.get('regions', [213])
        num_phrases: int = body_data.get('numPhrases', 2000)
        devices: List[str] = body_data.get('devices', ['all'])
        
        if not keywords:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Keywords are required'})
            }
        
        results = []
        errors = []
        
        for keyword in keywords:
            try:
                payload = {
                    'phrase': keyword,
                    'regions': [str(region) for region in regions],
                    'numPhrases': num_phrases,
                    'devices': [DEVICE_MAP.get(str(device), 'DEVICE_ALL') for device in devices],
                    'folderId': folder_id
                }
                
                print(f"[WORDSTAT] Request to API: keyword_length={len(keyword)}, regions={regions}")
                
                response = requests.post(
                    WORDSTAT_API_URL,
                    headers={
                        'Authorization': f'Api-Key {wordstat_token}',
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    json=payload,
                    timeout=30
                )
                
                print(f"[WORDSTAT] Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"[WORDSTAT] Success: {keyword} - {data.get('totalCount', 0)} results")
                    results.append({
                        'keyword': keyword,
                        'regions': regions,
                        'data': data
                    })
                else:
                    print(f"[WORDSTAT] Error response: {response.text}")
                    error_detail = {
                        'keyword': keyword,
                        'regions': regions,
                        'status_code': response.status_code,
                        'error_text': response.text
                    }
                    try:
                        error_json = response.json()
                        error_detail['error_json'] = error_json
                        print(f"[WORDSTAT] Error JSON: {json.dumps(error_json)}")
                    except:
                        pass
                    errors.append(error_detail)
                
                time.sleep(0.1)
                
            except Exception as e:
                print(f"[WORDSTAT] Exception: {str(e)}")
                errors.append({
                    'keyword': keyword,
                    'regions': regions,
                    'exception': str(e)
                })
        
        print(f"[WORDSTAT] Total results: {len(results)}, errors: {len(errors)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                    'success': len(results) > 0,
                    'partial_success': len(results) > 0 and len(errors) > 0,
                'results': results,
                'errors': errors,
                'total_requests': len(results),
                'failed_requests': len(errors)
            })
        }
        
    except Exception as e:
        print(f"[WORDSTAT] Fatal error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
