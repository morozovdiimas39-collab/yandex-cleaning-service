import json
import requests
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение списка запрещенных площадок из настроек РСЯ кампаний
    Args: event - dict with httpMethod, body, headers
          context - object with request_id attribute
    Returns: HTTP response with blocked platforms list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
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
    
    campaign_ids: List[str] = []
    
    if method == 'POST':
        body_str = event.get('body', '{}')
        if not body_str:
            body_str = '{}'
        try:
            body_data = json.loads(body_str)
            campaign_ids = body_data.get('campaign_ids', [])
        except json.JSONDecodeError:
            campaign_ids = []
    
    if not campaign_ids:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'campaign_ids required in request body'})
        }
    
    print(f'🎯 Getting blocked platforms for {len(campaign_ids)} campaigns')
    print(f'📋 Campaign IDs: {campaign_ids[:10]}...' if len(campaign_ids) > 10 else f'📋 Campaign IDs: {campaign_ids}')
    
    # Получаем информацию о кампаниях через Campaigns.get
    campaigns_url = 'https://api.direct.yandex.com/json/v5/campaigns'
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json'
    }
    
    campaigns_payload = {
        'method': 'get',
        'params': {
            'SelectionCriteria': {
                'Ids': [int(cid) for cid in campaign_ids]
            },
            'FieldNames': ['Id', 'Name', 'Type', 'ExcludedSites']
        }
    }
    
    try:
        response = requests.post(campaigns_url, headers=headers, json=campaigns_payload, timeout=30)
        print(f'📡 Campaigns API response: {response.status_code}')
        print(f'📡 Response body: {response.text[:2000]}')
        
        blocked_platforms: List[str] = []
        
        if response.status_code == 200:
            data = response.json()
            print(f'📦 Full API response: {str(data)[:3000]}')
            campaigns = data.get('result', {}).get('Campaigns', [])
            print(f'✅ Got {len(campaigns)} campaigns')
            
            # Извлекаем запрещенные площадки и группируем по кампаниям
            platforms_by_campaign = []
            all_platforms_set = set()
            
            for campaign in campaigns:
                campaign_id = str(campaign.get('Id'))
                campaign_name = campaign.get('Name', f'Campaign {campaign_id}')
                campaign_type = campaign.get('Type', 'UNKNOWN')
                
                excluded_sites_obj = campaign.get('ExcludedSites', {})
                excluded_sites = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
                
                if excluded_sites:
                    platforms_by_campaign.append({
                        'campaign_id': campaign_id,
                        'campaign_name': campaign_name,
                        'platforms': excluded_sites
                    })
                    all_platforms_set.update(excluded_sites)
                    print(f'  ✅ Campaign {campaign_id} ({campaign_type}): {len(excluded_sites)} blocked sites')
                else:
                    print(f'  ⚪ Campaign {campaign_id} ({campaign_type}): no blocked sites')
            
            blocked_platforms = list(all_platforms_set)
            print(f'🎉 Total unique platforms: {len(blocked_platforms)} across {len(platforms_by_campaign)} campaigns')
        
        else:
            error_text = response.text[:500]
            print(f'❌ Yandex API error: {response.status_code}, {error_text}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'blocked_platforms': blocked_platforms,
                'platforms_by_campaign': platforms_by_campaign,
                'total': len(blocked_platforms)
            })
        }
    
    except requests.exceptions.RequestException as e:
        print(f'❌ Request error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Request to Yandex API failed',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f'❌ Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }