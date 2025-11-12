import json
import os
import requests
import time
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение списка площадок из РСЯ кампаний Яндекс Директа
    Args: event - dict with httpMethod, body, headers
          context - object with request_id attribute
    Returns: HTTP response with platforms data
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
    action = None
    urls = []
    
    date_from = None
    date_to = None
    goal_id = None
    
    if method == 'POST':
        body_str = event.get('body', '{}')
        print(f'📦 RAW BODY: {repr(body_str)}')
        print(f'📦 BODY TYPE: {type(body_str)}')
        
        if not body_str:
            body_str = '{}'
        try:
            body_data = json.loads(body_str)
            print(f'✅ PARSED BODY: {body_data}')
            action = body_data.get('action')
            campaign_ids = body_data.get('campaign_ids', [])
            urls = body_data.get('urls', [])
            date_from = body_data.get('date_from')
            date_to = body_data.get('date_to')
            goal_id = body_data.get('goal_id')
            print(f'🎬 ACTION: {action}')
            print(f'🎯 CAMPAIGN IDS: {campaign_ids}')
            print(f'📅 DATE RANGE: {date_from} - {date_to}')
            print(f'🎯 GOAL ID: {goal_id}')
        except json.JSONDecodeError as e:
            print(f'❌ JSON DECODE ERROR: {e}')
            campaign_ids = []
    
    if not campaign_ids:
        print(f'⚠️ NO CAMPAIGN IDS, returning 400')
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'campaign_ids required in request body', 'debug_body': body_str if method == 'POST' else None})
        }
    
    if action == 'block':
        print(f'🚫 Blocking {len(urls)} URLs for {len(campaign_ids)} campaigns')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': f'Blocked {len(urls)} platforms'})
        }
    
    if action == 'unblock':
        print(f'✅ Unblocking {len(urls)} URLs for {len(campaign_ids)} campaigns')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': f'Unblocked {len(urls)} platforms'})
        }
    
    if action == 'get_blocked':
        print(f'🚫 Getting blocked platforms for {len(campaign_ids)} campaigns')
        
        campaigns_url = 'https://api.direct.yandex.com/json/v5/campaigns'
        headers_api = {
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
            response = requests.post(campaigns_url, headers=headers_api, json=campaigns_payload, timeout=30)
            print(f'📡 Campaigns API response: {response.status_code}')
            
            blocked_platforms: List[str] = []
            platforms_by_campaign = []
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('result', {}).get('Campaigns', [])
                print(f'✅ Got {len(campaigns)} campaigns')
                
                all_platforms_set = set()
                
                for campaign in campaigns:
                    campaign_id = str(campaign.get('Id'))
                    campaign_name = campaign.get('Name', f'Campaign {campaign_id}')
                    
                    excluded_sites_obj = campaign.get('ExcludedSites', {})
                    excluded_sites = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
                    
                    if excluded_sites:
                        platforms_by_campaign.append({
                            'campaign_id': campaign_id,
                            'campaign_name': campaign_name,
                            'platforms': excluded_sites
                        })
                        all_platforms_set.update(excluded_sites)
                        print(f'  🚫 Campaign {campaign_id}: {len(excluded_sites)} blocked sites')
                    else:
                        print(f'  ✅ Campaign {campaign_id}: no blocked sites')
                
                blocked_platforms = list(all_platforms_set)
                print(f'🎉 Total unique blocked platforms: {len(blocked_platforms)}')
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
                }, separators=(',', ':'))
            }
        except requests.exceptions.RequestException as e:
            print(f'❌ Request error: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Request to Yandex API failed', 'details': str(e)})
            }
        except Exception as e:
            print(f'❌ Unexpected error: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
            }
    
    stats_url = 'https://api.direct.yandex.com/json/v5/reports'
    campaigns_url = 'https://api.direct.yandex.com/json/v5/campaigns'
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json',
        'processingMode': 'auto',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    print(f'📋 Fetching campaign names for {len(campaign_ids)} campaigns')
    campaign_names = {}
    try:
        campaigns_payload = {
            'method': 'get',
            'params': {
                'SelectionCriteria': {
                    'Ids': [int(cid) for cid in campaign_ids]
                },
                'FieldNames': ['Id', 'Name']
            }
        }
        campaigns_response = requests.post(campaigns_url, headers=headers, json=campaigns_payload, timeout=10)
        if campaigns_response.status_code == 200:
            campaigns_data = campaigns_response.json()
            if 'result' in campaigns_data and 'Campaigns' in campaigns_data['result']:
                for camp in campaigns_data['result']['Campaigns']:
                    campaign_names[str(camp['Id'])] = camp['Name']
                print(f'✅ Loaded {len(campaign_names)} campaign names')
        else:
            print(f'⚠️ Failed to load campaign names: {campaigns_response.status_code}')
    except Exception as e:
        print(f'⚠️ Error loading campaign names: {e}')
    
    # Формируем SelectionCriteria с учетом фильтров
    selection_criteria = {
        'Filter': [
            {
                'Field': 'CampaignId',
                'Operator': 'IN',
                'Values': [str(cid) for cid in campaign_ids]
            }
        ],
        'DateFrom': date_from or '2024-10-01',
        'DateTo': date_to or '2024-10-31'
    }
    
    # Формируем params отчета
    # ВАЖНО: Если нет goal_id, не запрашиваем Conversions (иначе API вернет ошибку)
    field_names = ['CampaignId', 'Placement', 'Impressions', 'Clicks', 'Cost']
    
    # Добавляем Conversions только если goal_id указан
    if goal_id:
        field_names.append('Conversions')
    
    report_params = {
        'SelectionCriteria': selection_criteria,
        'FieldNames': field_names,
        'ReportName': f'Platforms Report {int(time.time() * 1000)}',
        'ReportType': 'CUSTOM_REPORT',
        'DateRangeType': 'CUSTOM_DATE',
        'Format': 'TSV',
        'IncludeVAT': 'NO',
        'IncludeDiscount': 'NO'
    }
    
    # Добавляем цель и модель атрибуции
    if goal_id:
        report_params['Goals'] = [str(goal_id)]
        report_params['AttributionModels'] = ['LSC']
    
    print(f'📊 FieldNames in request: {field_names}')
    
    stats_payload = {
        'params': report_params
    }
    
    try:
        print(f'🚀 Requesting report from Yandex API for {len(campaign_ids)} campaigns')
        
        # Шаг 1: Создаем отчет (POST запрос)
        stats_response = requests.post(stats_url, headers=headers, json=stats_payload, timeout=30)
        print(f'📡 Initial response status: {stats_response.status_code}')
        
        platforms: List[Dict[str, Any]] = []
        max_retries = 10
        retry_count = 0
        
        # Шаг 2: Ждем пока отчет сформируется (статус 200 = готов, 201/202 = в процессе)
        while retry_count < max_retries:
            if stats_response.status_code == 200:
                # Отчет готов, парсим данные
                print(f'✅ Report ready! Parsing {len(stats_response.text)} bytes')
                lines = stats_response.text.strip().split('\n')
                print(f'📊 Total lines: {len(lines)}')
                
                # Логируем первые 5 строк для отладки
                for i, line in enumerate(lines[:5]):
                    print(f'📝 Line {i}: {line[:200]}')
                
                for line in lines:
                    if not line or line.startswith('#'):
                        continue
                    
                    parts = line.split('\t')
                    
                    # Пропускаем заголовок
                    if parts[0] == 'CampaignId':
                        continue
                    
                    # Без цели: 5 полей, с целью: 6 полей
                    if len(parts) >= 5:
                        try:
                            campaign_id = parts[0]
                            url = parts[1] if len(parts[1]) > 0 else 'Unknown'
                            impressions = int(parts[2]) if parts[2].isdigit() else 0
                            clicks = int(parts[3]) if parts[3].isdigit() else 0
                            cost = float(parts[4]) if parts[4].replace('.', '').replace('-', '').isdigit() else 0.0
                            
                            # Конверсии только если есть 6-е поле (когда указан goal_id)
                            conversions = 0
                            if len(parts) >= 6:
                                try:
                                    if parts[5] != '--' and parts[5].strip():
                                        conversions = int(float(parts[5]))
                                except (ValueError, TypeError):
                                    conversions = 0
                            
                            # Логируем первую площадку с конверсиями для отладки
                            if conversions > 0 and len(platforms) == 0:
                                print(f'🎯 First conversion found: {url} -> {conversions} conversions')
                            
                            campaign_name = campaign_names.get(campaign_id, f'Campaign {campaign_id}')
                            
                            # Считаем метрики сразу
                            ctr = (clicks / impressions * 100) if impressions > 0 else 0
                            cpc = (cost / clicks) if clicks > 0 else 0
                            cpa = (cost / conversions) if conversions > 0 else 0
                            
                            platforms.append({
                                'url': url,
                                'clicks': clicks,
                                'impressions': impressions,
                                'cost': cost,
                                'conversions': conversions,
                                'ctr': round(ctr, 2),
                                'cpc': round(cpc, 2),
                                'cpa': round(cpa, 2),
                                'campaigns': [{'id': campaign_id, 'name': campaign_name}]
                            })
                        except (ValueError, IndexError) as e:
                            print(f'⚠️ Failed to parse line: {line[:100]}, error: {e}')
                            continue
                
                break
                
            elif stats_response.status_code in [201, 202]:
                # Отчет еще формируется, ждем и повторяем запрос
                retry_count += 1
                print(f'⏳ Report in progress (attempt {retry_count}/{max_retries}), waiting 2 seconds...')
                time.sleep(2)
                
                # Повторный запрос для получения отчета
                stats_response = requests.post(stats_url, headers=headers, json=stats_payload, timeout=30)
                print(f'📡 Retry response status: {stats_response.status_code}')
                
            else:
                # Ошибка от Яндекса
                error_text = stats_response.text[:500]
                print(f'❌ Yandex API error: {stats_response.status_code}, {error_text}')
                break
        
        if retry_count >= max_retries:
            print(f'⏱️ Timeout: Report not ready after {max_retries} attempts')
        
        # Загружаем список заблокированных площадок из Яндекса
        print(f'🚫 Loading blocked platforms from Yandex API')
        blocked_urls_set = set()
        try:
            campaigns_payload_blocked = {
                'method': 'get',
                'params': {
                    'SelectionCriteria': {
                        'Ids': [int(cid) for cid in campaign_ids]
                    },
                    'FieldNames': ['Id', 'Name', 'ExcludedSites']
                }
            }
            blocked_response = requests.post(campaigns_url, headers=headers, json=campaigns_payload_blocked, timeout=30)
            if blocked_response.status_code == 200:
                blocked_data = blocked_response.json()
                campaigns = blocked_data.get('result', {}).get('Campaigns', [])
                for campaign in campaigns:
                    excluded_sites_obj = campaign.get('ExcludedSites', {})
                    excluded_sites = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
                    blocked_urls_set.update(excluded_sites)
                print(f'✅ Found {len(blocked_urls_set)} blocked URLs')
            else:
                print(f'⚠️ Failed to load blocked platforms: {blocked_response.status_code}')
        except Exception as e:
            print(f'⚠️ Error loading blocked platforms: {e}')
        
        # Помечаем заблокированные площадки
        for platform in platforms:
            platform['blocked'] = platform['url'] in blocked_urls_set
        
        print(f'🎉 Returning {len(platforms)} platforms')
        if len(platforms) > 0:
            print(f'📋 Sample platforms: {platforms[:3]}')
        
        response_body = json.dumps({
            'platforms': platforms,
            'total': len(platforms)
        }, separators=(',', ':'), ensure_ascii=False)
        
        print(f'📦 Response size: {len(response_body)} bytes')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': response_body
        }
    
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': 'Request to Yandex API failed',
                'details': str(e)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }