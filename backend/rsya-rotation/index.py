import json
import os
import re
from typing import Dict, Any, List
import psycopg2
import psycopg2.extras
import requests

BATCH_SIZE = 20  # Обрабатываем 20 кампаний за раз

def calculate_priority_score(item: Dict[str, Any]) -> float:
    '''Расчет приоритета площадки для блокировки (больше = важнее заблокировать)'''
    domain = item.get('domain', '').lower()
    clicks = item.get('clicks', 0)
    cost = item.get('cost', 0)
    conversions = item.get('conversions', 0)
    cpa = item.get('cpa', 0)
    
    score = 0.0
    
    # ВЫСОКИЙ ПРИОРИТЕТ: Подозрительные домены
    suspicious_patterns = [
        r'\.com$', r'dsp', r'vpn',
        r'game|игр|казино|poker|casino',
        r'adult|xxx|porn', r'download|торрент'
    ]
    
    is_suspicious = any(re.search(pattern, domain) for pattern in suspicious_patterns)
    
    if is_suspicious:
        score += 100
        if cost > 100:
            score += 50
        if clicks > 50:
            score += 30
    
    # СРЕДНИЙ ПРИОРИТЕТ: Бесполезный трафик
    if cost > 0 and clicks > 10:
        cpc = cost / clicks
        if cpc < 5 and conversions == 0:
            score += 60
    
    if cpa > 1000:
        score += 70
    
    # Чем больше расход - тем выше приоритет
    if cost > 0:
        score += min(cost / 10, 50)
    
    return score


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Ежедневная ротация площадок РСЯ (батчинг 20 кампаний)
    Args: event - dict с httpMethod (GET для ручного запуска, TIMER для крона)
          context - объект с request_id
    Returns: HTTP response dict с результатами ротации
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем последний обработанный campaign_id
        cursor.execute("""
            SELECT value FROM automation_state WHERE key = 'rsya_rotation_last_campaign_id'
        """)
        state = cursor.fetchone()
        last_campaign_id = state['value']['campaign_id'] if state else 0
        
        # Получаем все проекты с кампаниями больше last_campaign_id
        cursor.execute("""
            SELECT DISTINCT p.id as project_id, p.yandex_token, p.campaign_ids, p.name
            FROM rsya_projects p
            WHERE p.yandex_token IS NOT NULL
              AND p.campaign_ids IS NOT NULL
        """)
        
        projects = cursor.fetchall()
        
        if not projects:
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No projects found',
                    'rotated_campaigns': 0
                })
            }
        
        # Собираем все кампании из всех проектов
        all_campaigns = []
        for project in projects:
            project_id = project['project_id']
            token = project['yandex_token']
            campaign_ids = project['campaign_ids']
            project_name = project['name']
            
            if isinstance(campaign_ids, str):
                campaign_ids = json.loads(campaign_ids)
            
            for campaign_id in campaign_ids:
                # Приводим campaign_id к int если нужно
                campaign_id_int = int(campaign_id) if isinstance(campaign_id, str) else campaign_id
                
                if campaign_id_int > last_campaign_id:
                    all_campaigns.append({
                        'campaign_id': campaign_id_int,
                        'project_id': project_id,
                        'token': token,
                        'project_name': project_name
                    })
        
        # Сортируем по campaign_id
        all_campaigns.sort(key=lambda x: x['campaign_id'])
        
        # Берем только BATCH_SIZE кампаний
        campaigns_to_process = all_campaigns[:BATCH_SIZE]
        
        if not campaigns_to_process:
            # Начинаем сначала
            print(f'🔄 Reached end of campaigns, resetting to start')
            cursor.execute("""
                UPDATE automation_state 
                SET value = '{"campaign_id": 0}'::jsonb, updated_at = NOW()
                WHERE key = 'rsya_rotation_last_campaign_id'
            """)
            conn.commit()
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Rotation cycle completed, reset to start',
                    'rotated_campaigns': 0
                })
            }
        
        print(f'🔄 ROTATION: Processing {len(campaigns_to_process)} campaigns (batch size: {BATCH_SIZE})')
        
        rotated_count = 0
        results = []
        
        for campaign_data in campaigns_to_process:
            campaign_id = campaign_data['campaign_id']
            project_id = campaign_data['project_id']
            token = campaign_data['token']
            project_name = campaign_data['project_name']
            
            try:
                result = rotate_campaign_if_needed(token, campaign_id, project_id, cursor)
                if result['rotated']:
                    rotated_count += 1
                results.append(result)
            except Exception as e:
                print(f'❌ Error rotating campaign {campaign_id}: {str(e)}')
        
        # Сохраняем прогресс
        last_processed_id = campaigns_to_process[-1]['campaign_id']
        cursor.execute("""
            UPDATE automation_state 
            SET value = %s::jsonb, updated_at = NOW()
            WHERE key = 'rsya_rotation_last_campaign_id'
        """, (json.dumps({'campaign_id': last_processed_id}),))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Rotation batch completed: {rotated_count} campaigns rotated. Last ID: {last_processed_id}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'rotated_campaigns': rotated_count,
                'last_campaign_id': last_processed_id,
                'batch_size': BATCH_SIZE,
                'results': results
            })
        }
        
    except Exception as e:
        print(f'❌ Error in rotation handler: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def rotate_campaign_if_needed(token: str, campaign_id: int, project_id: int, cursor) -> Dict[str, Any]:
    '''Проверяет кампанию на лимит и запускает ротацию если нужно'''
    
    # Получаем текущие запрещенные площадки
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Content-Type': 'application/json'
    }
    
    get_body = {
        "method": "get",
        "params": {
            "SelectionCriteria": {
                "Ids": [campaign_id]
            },
            "FieldNames": ["Id"],
            "TextCampaignFieldNames": ["ExcludedSites"]
        }
    }
    
    response = requests.post(
        'https://api.direct.yandex.com/json/v5/campaigns',
        headers=headers,
        json=get_body,
        timeout=10
    )
    
    if response.status_code != 200:
        return {'campaign_id': campaign_id, 'rotated': False, 'error': 'Failed to get campaign'}
    
    data = response.json()
    campaigns = data.get('result', {}).get('Campaigns', [])
    
    if not campaigns:
        return {'campaign_id': campaign_id, 'rotated': False, 'error': 'Campaign not found'}
    
    campaign = campaigns[0]
    excluded_sites_obj = campaign.get('TextCampaign', {}).get('ExcludedSites', {})
    current_excluded = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
    
    # Ротируем только если достигнут порог (950+ площадок из 1000)
    ROTATION_THRESHOLD = 950
    
    if len(current_excluded) < ROTATION_THRESHOLD:
        print(f'⏭️  Campaign {campaign_id}: {len(current_excluded)}/1000 sites, rotation NOT needed')
        return {'campaign_id': campaign_id, 'rotated': False, 'reason': f'Below threshold ({len(current_excluded)}/950)'}
    
    print(f'🔄 Campaign {campaign_id}: {len(current_excluded)}/1000 sites, starting rotation...')
    
    # Получаем метрики для текущих площадок из БД
    platforms_with_metrics = []
    
    for domain in current_excluded:
        cursor.execute("""
            SELECT domain, clicks, cost, conversions, cpa
            FROM block_queue
            WHERE campaign_id = %s AND domain = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (campaign_id, domain))
        
        row = cursor.fetchone()
        
        if row:
            platforms_with_metrics.append({
                'domain': domain,
                'clicks': row['clicks'] or 0,
                'cost': float(row['cost']) if row['cost'] else 0,
                'conversions': row['conversions'] or 0,
                'cpa': float(row['cpa']) if row['cpa'] else 0
            })
        else:
            # Если нет метрик в БД - даем минимальный приоритет
            platforms_with_metrics.append({
                'domain': domain,
                'clicks': 0,
                'cost': 0,
                'conversions': 0,
                'cpa': 0
            })
    
    # Рассчитываем приоритет для каждой площадки
    for platform in platforms_with_metrics:
        platform['priority_score'] = calculate_priority_score(platform)
    
    # Сортируем по приоритету (низкий приоритет = первые на удаление)
    platforms_with_metrics.sort(key=lambda x: x['priority_score'])
    
    # Удаляем 20% самых низкоприоритетных (примерно 200 площадок освобождаем)
    remove_count = int(len(platforms_with_metrics) * 0.2)
    platforms_to_remove = platforms_with_metrics[:remove_count]
    platforms_to_keep = platforms_with_metrics[remove_count:]
    
    print(f'📊 Removing {remove_count} lowest priority platforms (keeping {len(platforms_to_keep)})')
    
    # Новый список ExcludedSites
    new_excluded = [p['domain'] for p in platforms_to_keep]
    
    # Обновляем в Яндексе
    update_body = {
        "method": "update",
        "params": {
            "Campaigns": [{
                "Id": campaign_id,
                "ExcludedSites": {
                    "Items": new_excluded
                }
            }]
        }
    }
    
    update_response = requests.post(
        'https://api.direct.yandex.com/json/v5/campaigns',
        headers=headers,
        json=update_body,
        timeout=30
    )
    
    if update_response.status_code != 200:
        print(f'❌ Failed to update campaign {campaign_id}: {update_response.text}')
        return {'campaign_id': campaign_id, 'rotated': False, 'error': 'Failed to update campaign'}
    
    # Удаляем из block_queue записи для удаленных площадок
    for platform in platforms_to_remove:
        cursor.execute("""
            DELETE FROM block_queue
            WHERE campaign_id = %s AND domain = %s
        """, (campaign_id, platform['domain']))
    
    print(f'✅ Campaign {campaign_id}: rotated {remove_count} platforms, {len(new_excluded)} remain')
    
    return {
        'campaign_id': campaign_id,
        'rotated': True,
        'removed_count': remove_count,
        'remaining_count': len(new_excluded),
        'freed_slots': 1000 - len(new_excluded)
    }