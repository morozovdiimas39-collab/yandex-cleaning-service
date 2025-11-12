import json
import requests
from typing import Dict, Any
import time

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение статистики по заблокированным площадкам через Reports API
    Args: event - dict with httpMethod, body (campaign_ids, platforms, date_from, date_to, goal_id), headers
          context - object with request_id attribute
    Returns: HTTP response with platform statistics grouped by campaigns
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Allow-Max-Age': '86400'
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
            'body': json.dumps({'error': 'Only POST method allowed'})
        }
    
    body_str = event.get('body', '{}')
    if not body_str:
        body_str = '{}'
    
    try:
        body_data = json.loads(body_str)
        campaign_ids = body_data.get('campaign_ids', [])
        platforms = body_data.get('platforms', [])
        date_from = body_data.get('date_from', '2024-01-01')
        date_to = body_data.get('date_to')
        goal_id = body_data.get('goal_id')
        
        print(f'📅 DATE RANGE: {date_from} - {date_to}')
        print(f'🎯 GOAL ID: {goal_id}')
        print(f'📊 Platforms to filter: {len(platforms)}')
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    
    if not campaign_ids:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'campaign_ids required'})
        }
    
    if not platforms:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'platforms required'})
        }
    
    # Формируем запрос к Reports API
    stats_url = 'https://api.direct.yandex.com/json/v5/reports'
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    # SelectionCriteria с фильтром по кампаниям и площадкам
    selection_criteria = {
        'Filter': [
            {
                'Field': 'CampaignId',
                'Operator': 'IN',
                'Values': [str(cid) for cid in campaign_ids]
            },
            {
                'Field': 'Placement',
                'Operator': 'IN',
                'Values': platforms[:1000]  # Ограничение API Яндекса
            }
        ],
        'DateFrom': date_from,
        'DateTo': date_to or time.strftime('%Y-%m-%d')
    }
    
    # FieldNames с Conversions если указана цель
    field_names = ['CampaignId', 'CampaignName', 'Placement', 'Impressions', 'Clicks', 'Cost']
    if goal_id:
        field_names.append('Conversions')
    
    report_params = {
        'SelectionCriteria': selection_criteria,
        'FieldNames': field_names,
        'ReportName': f'Blocked Stats {int(time.time() * 1000)}',
        'ReportType': 'CUSTOM_REPORT',
        'DateRangeType': 'CUSTOM_DATE',
        'Format': 'TSV',
        'IncludeVAT': 'NO',
        'IncludeDiscount': 'NO'
    }
    
    # Добавляем Goals если указана цель
    if goal_id:
        report_params['Goals'] = [str(goal_id)]
        report_params['AttributionModels'] = ['LSC']
    
    print(f'📊 FieldNames in request: {field_names}')
    
    stats_payload = {
        'params': report_params
    }
    
    try:
        print('📡 Requesting blocked platforms stats...')
        max_retries = 15
        retry_count = 0
        platforms_data = []
        
        while retry_count < max_retries:
            stats_response = requests.post(stats_url, headers=headers, json=stats_payload, timeout=30)
            print(f'📊 Response status: {stats_response.status_code}')
            
            if stats_response.status_code == 200:
                # Отчет готов
                print(f'✅ Report ready! Parsing {len(stats_response.text)} bytes')
                lines = stats_response.text.strip().split('\n')
                print(f'📊 Total lines: {len(lines)}')
                
                # Логируем первые 3 строки
                for i, line in enumerate(lines[:3]):
                    print(f'📝 Line {i}: {line[:150]}')
                
                for line in lines:
                    # Пропускаем заголовок
                    if line.startswith('CampaignId'):
                        print(f'⏭️ Skipping header')
                        continue
                    
                    parts = line.split('\t')
                    min_parts = 7 if goal_id else 6
                    
                    if len(parts) >= min_parts:
                        try:
                            campaign_id = parts[0]
                            campaign_name = parts[1]
                            url = parts[2] if len(parts[2]) > 0 else 'Unknown'
                            impressions = int(parts[3]) if parts[3].isdigit() else 0
                            clicks = int(parts[4]) if parts[4].isdigit() else 0
                            cost = float(parts[5]) if parts[5].replace('.', '').replace('-', '').isdigit() else 0.0
                            
                            # Conversions если цель указана
                            conversions = 0
                            if goal_id and len(parts) >= 7:
                                try:
                                    if parts[6] != '--' and parts[6].strip():
                                        conversions = int(float(parts[6]))
                                except (ValueError, TypeError):
                                    conversions = 0
                            
                            platforms_data.append({
                                'campaign_id': campaign_id,
                                'campaign_name': campaign_name,
                                'url': url,
                                'clicks': clicks,
                                'impressions': impressions,
                                'cost': cost,
                                'conversions': conversions,
                                'blocked': True
                            })
                        except (ValueError, IndexError) as e:
                            print(f'⚠️ Failed to parse line: {line[:100]}, error: {e}')
                            continue
                
                break
                
            elif stats_response.status_code in [201, 202]:
                # Отчет формируется
                retry_count += 1
                print(f'⏳ Report in progress (attempt {retry_count}/{max_retries}), waiting 2 seconds...')
                time.sleep(2)
                
                # Повторный запрос
                stats_response = requests.post(stats_url, headers=headers, json=stats_payload, timeout=30)
                print(f'📡 Retry response status: {stats_response.status_code}')
                
            else:
                error_text = stats_response.text[:500]
                print(f'❌ Yandex API error: {stats_response.status_code}, {error_text}')
                break
        
        if retry_count >= max_retries:
            print(f'⏱️ Timeout: Report not ready after {max_retries} attempts')
        
        print(f'🎉 Returning {len(platforms_data)} platforms')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'platforms': platforms_data,
                'total': len(platforms_data)
            })
        }
        
    except requests.exceptions.Timeout:
        print('❌ Request timeout')
        return {
            'statusCode': 504,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Request timeout'})
        }
    except Exception as e:
        print(f'❌ Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
