import json
import os
from typing import Dict, Any, List
import requests

def flatten_tree(node: Dict, parent_id: int = None) -> List[Dict]:
    '''Рекурсивно обходит дерево и собирает все регионы'''
    results = []
    
    region_id = int(node['value'])
    region_name = node['label']
    
    # Определяем тип региона
    region_type = 'unknown'
    if parent_id is None:
        region_type = 'country'
    elif 'федеральный округ' in region_name.lower():
        region_type = 'federal_district'
    elif 'область' in region_name:
        region_type = 'region'
    elif 'край' in region_name:
        region_type = 'krai'
    elif 'республика' in region_name.lower():
        region_type = 'republic'
    elif 'автономный округ' in region_name.lower() or 'ао' in region_name.lower():
        region_type = 'autonomous_okrug'
    else:
        region_type = 'city'
    
    results.append({
        'id': region_id,
        'name': region_name,
        'type': region_type,
        'parent_id': parent_id
    })
    
    # Рекурсивно обходим детей
    if node.get('children'):
        for child in node['children']:
            results.extend(flatten_tree(child, parent_id=region_id))
    
    return results

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получает дерево регионов из Яндекс API и возвращает плоский список с parent_id
    Args: event с httpMethod
    Returns: JSON со всеми регионами включая parent_id и проверкой дубликатов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
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
    
    wordstat_token = os.environ.get('YANDEX_WORDSTAT_TOKEN')
    if not wordstat_token:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'YANDEX_WORDSTAT_TOKEN not configured'})
        }
    
    try:
        print('[REGIONS] Fetching regions tree from Yandex Wordstat API...')
        
        response = requests.post(
            'https://api.wordstat.yandex.net/v1/getRegionsTree',
            headers={
                'Authorization': f'Bearer {wordstat_token}',
                'Content-Type': 'application/json;charset=utf-8'
            },
            json={},
            timeout=30
        )
        
        print(f'[REGIONS] Response status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'[REGIONS] Success: received regions tree')
            
            # Преобразуем дерево в плоский список с parent_id
            flat_regions = []
            for root in data:
                flat_regions.extend(flatten_tree(root))
            
            # Проверяем дубликаты ID
            id_counts = {}
            for region in flat_regions:
                rid = region['id']
                if rid in id_counts:
                    id_counts[rid].append(region['name'])
                else:
                    id_counts[rid] = [region['name']]
            
            duplicates = {rid: names for rid, names in id_counts.items() if len(names) > 1}
            if duplicates:
                print(f'[REGIONS] ⚠️ ДУБЛИКАТЫ ID: {json.dumps(duplicates, ensure_ascii=False)}')
            
            print(f'[REGIONS] Обработано регионов: {len(flat_regions)}')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'regions': flat_regions,
                    'total': len(flat_regions),
                    'duplicates': duplicates
                }, ensure_ascii=False)
            }
        else:
            print(f'[REGIONS] Error response: {response.text}')
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to fetch regions',
                    'details': response.text
                })
            }
        
    except Exception as e:
        print(f'[REGIONS] Fatal error: {str(e)}')
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
