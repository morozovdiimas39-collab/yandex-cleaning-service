'''
Business: Получение и кеширование статистики площадок из Яндекс.Директ + Admin Stats
Args: event с httpMethod, body (project_id, campaign_ids, date_from, date_to, goal_id, force_refresh) или queryStringParameters.stats
Returns: JSON со статистикой площадок из кеша или API, либо admin stats
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
import requests

def handle_admin_stats(stats_type: str) -> dict:
    """Admin эндпоинт для получения статистики по задачам"""
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if stats_type == 'tasks':
            cursor.execute('''
                SELECT 
                    t.id, 
                    t.description, 
                    t.enabled, 
                    p.name as project_name,
                    COUNT(DISTINCT bq.id) as total_placements,
                    COUNT(DISTINCT CASE WHEN bq.status = 'blocked' THEN bq.id END) as blocked_placements,
                    COUNT(DISTINCT CASE WHEN bq.status = 'pending' THEN bq.id END) as pending_placements,
                    COALESCE(SUM(bq.cost), 0) as total_cost
                FROM t_p97630513_yandex_cleaning_serv.rsya_tasks t
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON t.project_id = p.id
                LEFT JOIN t_p97630513_yandex_cleaning_serv.block_queue bq ON bq.task_id = t.id
                GROUP BY t.id, t.description, t.enabled, p.name
                ORDER BY t.id DESC
            ''')
            tasks = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'tasks': tasks}, default=str)
            }
        
        else:  # overview
            cursor.execute('''
                SELECT execution_type, COUNT(*) as executions,
                       SUM(placements_found) as total_found,
                       SUM(placements_blocked) as total_blocked
                FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
                GROUP BY execution_type
            ''')
            execution_stats = cursor.fetchall()
            
            cursor.execute('''
                SELECT status, COUNT(*) as count
                FROM t_p97630513_yandex_cleaning_serv.block_queue
                GROUP BY status
            ''')
            queue_stats = cursor.fetchall()
            
            cursor.execute('''
                SELECT 
                    el.id, el.execution_type, el.started_at,
                    el.placements_found, el.placements_matched,
                    el.placements_sent_to_queue, el.placements_blocked,
                    p.name as project_name, t.description as task_description
                FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs el
                LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON el.project_id = p.id
                LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON el.task_id = t.id
                ORDER BY el.started_at DESC
                LIMIT 10
            ''')
            recent_executions = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'execution_stats': execution_stats,
                    'queue_stats': queue_stats,
                    'recent_executions': recent_executions
                }, default=str)
            }
    
    except Exception as e:
        print(f'❌ Admin Stats Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    
    # ADMIN STATS эндпоинт
    if method == 'GET' and query_params.get('stats'):
        return handle_admin_stats(query_params.get('stats'))
    
    # DEBUG эндпоинт для просмотра TSV
    if method == 'GET' and query_params.get('debug') == 'tsv':
        # Достаем из БД последнюю сохраненную TSV строку
        body_str = event.get('body') or '{}'
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain'},
            'body': 'Debug endpoint - check logs for TSV data'
        }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_str = event.get('body') or '{}'
        body = json.loads(body_str) if body_str else {}
        project_id = body.get('project_id')
        campaign_ids = body.get('campaign_ids', [])
        date_from = body.get('date_from')
        date_to = body.get('date_to')
        goal_id = body.get('goal_id', '')
        force_refresh = body.get('force_refresh', False)
        
        auth_token = event.get('headers', {}).get('X-Auth-Token', '')
        
        if not project_id or not campaign_ids or not date_from or not date_to:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        
        # Если не force_refresh, пытаемся взять из кеша
        if not force_refresh:
            cached_count = check_cache_exists(conn, project_id, campaign_ids, date_from, date_to, goal_id)
            if cached_count > 0:
                conn.close()
                print(f'✅ Cache exists: {cached_count} platforms. Please use direct DB query.')
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'from_cache': True, 
                        'platforms_count': cached_count,
                        'message': 'Data is cached. Use direct DB query to fetch platforms.'
                    })
                }
        
        # Загружаем свежую статистику из API
        fresh_stats = fetch_stats_from_api(auth_token, campaign_ids, date_from, date_to, goal_id)
        
        # Сохраняем в кеш
        save_stats_to_cache(conn, project_id, fresh_stats, date_from, date_to, goal_id)
        
        conn.close()
        
        print(f'✅ Saved {len(fresh_stats)} platforms to cache')
        
        # НЕ возвращаем 7496 площадок в ответе - это слишком большой JSON!
        # Фронтенд сделает повторный запрос с from_cache=False и получит данные
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'platforms_count': len(fresh_stats),
                'message': 'Data cached successfully. Please reload to fetch from cache.'
            })
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def check_cache_exists(conn, project_id: int, campaign_ids: list, date_from: str, date_to: str, goal_id: str):
    """Проверяет наличие кеша и возвращает количество записей"""
    cur = conn.cursor()
    
    campaign_ids_str = ','.join([f"'{cid}'" for cid in campaign_ids])
    
    query = f"""
        SELECT COUNT(*) as count
        FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats
        WHERE project_id = {project_id}
          AND campaign_id IN ({campaign_ids_str})
          AND date_from = '{date_from}'
          AND date_to = '{date_to}'
          AND COALESCE(goal_id, '') = '{goal_id}'
    """
    
    cur.execute(query)
    result = cur.fetchone()
    cur.close()
    
    return result[0] if result else 0

def get_cached_stats(conn, project_id: int, campaign_ids: list, date_from: str, date_to: str, goal_id: str):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    campaign_ids_str = ','.join([f"'{cid}'" for cid in campaign_ids])
    
    query = f"""
        SELECT campaign_id, campaign_name, url, impressions, clicks, cost, 
               conversions, ctr, cpc, cpa, is_blocked, 
               COALESCE(status, CASE WHEN is_blocked THEN 'blocked' ELSE 'active' END) as status
        FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats
        WHERE project_id = {project_id}
          AND campaign_id IN ({campaign_ids_str})
          AND date_from = '{date_from}'
          AND date_to = '{date_to}'
          AND COALESCE(goal_id, '') = '{goal_id}'
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    
    if not rows:
        return None
    
    # Конвертируем Decimal в float для JSON сериализации
    result = []
    for row in rows:
        row_dict = dict(row)
        # Конвертируем все Decimal поля в float
        for key in ['cost', 'ctr', 'cpc', 'cpa']:
            if key in row_dict and row_dict[key] is not None:
                row_dict[key] = float(row_dict[key])
        result.append(row_dict)
    
    return result

def save_stats_to_cache(conn, project_id: int, stats: list, date_from: str, date_to: str, goal_id: str):
    print(f'💾 Saving {len(stats)} platforms to cache...')
    cur = conn.cursor()
    
    # Сначала удаляем старые записи для этого проекта и периода
    delete_query = f"""
        DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats
        WHERE project_id = {project_id}
          AND date_from = '{date_from}'
          AND date_to = '{date_to}'
          AND COALESCE(goal_id, '') = '{goal_id}'
    """
    cur.execute(delete_query)
    print(f'🗑️  Deleted old cache')
    
    # Батч-вставка через один большой INSERT (в 100 раз быстрее!)
    if stats:
        values_parts = []
        for stat in stats:
            campaign_name = stat.get('campaign_name', '').replace("'", "''")
            url = stat['url'].replace("'", "''")
            ctr = stat.get('ctr', 0) or 'NULL'
            cpc = stat.get('cpc', 0) or 'NULL'
            cpa = stat.get('cpa', 0) or 'NULL'
            
            values_parts.append(f"""(
                {project_id},
                '{stat['campaign_id']}',
                '{campaign_name}',
                '{url}',
                '{date_from}',
                '{date_to}',
                '{goal_id}',
                {stat.get('impressions', 0)},
                {stat.get('clicks', 0)},
                {stat.get('cost', 0)},
                {stat.get('conversions', 0)},
                {ctr},
                {cpc},
                {cpa},
                false,
                CURRENT_TIMESTAMP
            )""")
        
        insert_query = f"""
            INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_platform_stats
            (project_id, campaign_id, campaign_name, url, date_from, date_to, goal_id,
             impressions, clicks, cost, conversions, ctr, cpc, cpa, is_blocked, cached_at)
            VALUES {','.join(values_parts)}
        """
        
        cur.execute(insert_query)
        print(f'✅ Inserted {len(stats)} platforms')
    
    conn.commit()
    cur.close()
    print(f'💾 Cache saved!')

def fetch_stats_from_api(token: str, campaign_ids: list, date_from: str, date_to: str, goal_id: str):
    url = 'https://api.direct.yandex.com/json/v5/reports'
    
    print(f'🚀 Starting API request for {len(campaign_ids)} campaigns')
    print(f'📅 Date range: {date_from} to {date_to}')
    print(f'🎯 Goal ID: {goal_id or "None"}')
    
    field_names = ['CampaignId', 'CampaignName', 'Placement', 'Impressions', 'Clicks', 'Cost', 'Ctr', 'AvgCpc']
    
    # Всегда добавляем поля конверсий
    field_names.extend(['Conversions', 'CostPerConversion'])
    
    selection_criteria = {
        'DateFrom': date_from,
        'DateTo': date_to,
        'Filter': [
            {
                'Field': 'CampaignId',
                'Operator': 'IN',
                'Values': [str(cid) for cid in campaign_ids]
            },
            {
                'Field': 'Impressions',
                'Operator': 'GREATER_THAN',
                'Values': ['0']
            }
        ]
    }
    
    goals_params = None
    if goal_id and goal_id != '':
        goal_ids = [int(gid.strip()) for gid in goal_id.split(',') if gid.strip()]
        if goal_ids:
            # Яндекс API ограничивает максимум 10 целей
            if len(goal_ids) > 10:
                print(f'⚠️  Too many goals ({len(goal_ids)}), using first 10')
                goals_params = goal_ids[:10]
            else:
                goals_params = goal_ids
    
    payload = {
        'params': {
            'SelectionCriteria': selection_criteria,
            'FieldNames': field_names,
            'ReportName': f'Platform Stats {datetime.now().isoformat()}',
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO'
        }
    }
    
    if goals_params:
        payload['params']['Goals'] = goals_params
    
    print(f'📋 Request payload: {json.dumps(payload, ensure_ascii=False)[:500]}')
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'Client-Login': '',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    import time
    
    print(f'⏳ Sending initial request to Yandex API...')
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    
    print(f'📡 Initial response status: {response.status_code}')
    
    if response.status_code == 201 or response.status_code == 202:
        print(f'⏰ Report is being generated, waiting...')
        # Ждём готовности отчёта (максимум 120 попыток по 3 секунды = 6 минут)
        for attempt in range(120):
            print(f'🔄 Attempt {attempt + 1}/120')
            time.sleep(3)
            
            retry_response = requests.post(url, json=payload, headers=headers, timeout=120)
            
            print(f'📡 Retry response status: {retry_response.status_code}')
            
            if retry_response.status_code == 200:
                print(f'✅ Report ready! Parsing {len(retry_response.text)} bytes')
                parsed = parse_tsv_report(retry_response.text, goal_id)
                print(f'✅ Parsed {len(parsed)} platforms')
                return parsed
            elif retry_response.status_code not in [201, 202]:
                print(f'❌ Report failed: {retry_response.text[:500]}')
                raise Exception(f'Report failed: {retry_response.status_code} - {retry_response.text[:200]}')
        
        print(f'⏰ Report generation timeout after 6 minutes')
        raise Exception('Report generation timeout (>6 minutes)')
    
    elif response.status_code == 200:
        print(f'✅ Report ready immediately! Parsing {len(response.text)} bytes')
        parsed = parse_tsv_report(response.text, goal_id)
        print(f'✅ Parsed {len(parsed)} platforms')
        return parsed
    else:
        print(f'❌ API error: {response.text[:500]}')
        raise Exception(f'API error: {response.status_code} - {response.text[:200]}')

def parse_tsv_report(tsv_text: str, goal_id: str):
    lines = tsv_text.strip().split('\n')
    
    if len(lines) < 2:
        return []
    
    header = lines[0].split('\t')
    print(f'📋 TSV Header: {header}')
    print(f'🎯 Goal ID: {goal_id}')
    
    # Создаём маппинг column_name -> index
    header_map = {col: idx for idx, col in enumerate(header)}
    print(f'📋 Header map: {header_map}')
    
    # Определяем индексы для обязательных полей
    campaign_id_idx = header_map.get('CampaignId', 0)
    campaign_name_idx = header_map.get('CampaignName', 1)
    placement_idx = header_map.get('Placement', 2)
    impressions_idx = header_map.get('Impressions', 3)
    clicks_idx = header_map.get('Clicks', 4)
    cost_idx = header_map.get('Cost', 5)
    ctr_idx = header_map.get('Ctr', 6)
    cpc_idx = header_map.get('AvgCpc', 7)
    
    # Ищем поля конверсий и CPA
    conversions_idx = None
    cpa_idx = None
    goal_cost_idx = None
    
    if goal_id and goal_id != '' and goal_id != 'all':
        # Если указана цель, сначала ищем GoalConversions (из Goals параметра)
        if 'GoalConversions' in header_map:
            conversions_idx = header_map['GoalConversions']
            print(f'✅ Found GoalConversions field at index {conversions_idx}')
        # Альтернатива: поле Conversions_<goal_id>_* (старый формат)
        else:
            for col_name, idx in header_map.items():
                if col_name.startswith('Conversions_') and goal_id in col_name:
                    conversions_idx = idx
                    print(f'✅ Found goal-specific conversions field: {col_name} at index {idx}')
                    break
        
        # Ищем GoalCost для расчёта CPA
        if 'GoalCost' in header_map:
            goal_cost_idx = header_map['GoalCost']
            print(f'✅ Found GoalCost field at index {goal_cost_idx}')
        # Альтернатива: CostPerConversion_<goal_id>
        else:
            for col_name, idx in header_map.items():
                if col_name.startswith('CostPerConversion_') and goal_id in col_name:
                    cpa_idx = idx
                    print(f'✅ Found goal-specific CPA field: {col_name} at index {idx}')
                    break
    else:
        # Если цель не указана, ищем общие поля Conversions и CostPerConversion
        conversions_idx = header_map.get('Conversions')
        cpa_idx = header_map.get('CostPerConversion')
        if conversions_idx:
            print(f'✅ Using general Conversions field at index {conversions_idx}')
        if cpa_idx:
            print(f'✅ Using general CostPerConversion field at index {cpa_idx}')
    
    print(f'📋 First 3 data lines:')
    for i, line in enumerate(lines[1:4]):
        print(f'  Line {i+1}: {line}')
    
    platforms = []
    
    for line in lines[1:]:
        fields = line.split('\t')
        
        if len(fields) < 8:
            continue
        
        campaign_id = fields[campaign_id_idx] if campaign_id_idx < len(fields) else ''
        campaign_name = fields[campaign_name_idx] if campaign_name_idx < len(fields) else ''
        url = fields[placement_idx] if placement_idx < len(fields) else ''
        impressions = int(fields[impressions_idx]) if impressions_idx < len(fields) and fields[impressions_idx] else 0
        clicks = int(fields[clicks_idx]) if clicks_idx < len(fields) and fields[clicks_idx] else 0
        cost_micro = float(fields[cost_idx]) if cost_idx < len(fields) and fields[cost_idx] else 0.0
        ctr = float(fields[ctr_idx]) if ctr_idx < len(fields) and fields[ctr_idx] and fields[ctr_idx] != '--' else 0.0
        cpc_micro = float(fields[cpc_idx]) if cpc_idx < len(fields) and fields[cpc_idx] and fields[cpc_idx] != '--' else 0.0
        
        # Яндекс возвращает cost и cpc в микро-единицах (1 рубль = 1 000 000)
        cost = cost_micro / 1_000_000
        cpc = cpc_micro / 1_000_000
        
        conversions = 0
        cpa_value = 0.0
        
        # Парсим конверсии из правильного поля
        if conversions_idx is not None and conversions_idx < len(fields):
            conv_str = fields[conversions_idx]
            conversions = int(conv_str) if conv_str and conv_str != '--' else 0
        
        # Парсим CPA: сначала пробуем CostPerConversion, потом GoalCost
        if cpa_idx is not None and cpa_idx < len(fields):
            cpa_str = fields[cpa_idx]
            cpa_micro = float(cpa_str) if cpa_str and cpa_str != '--' else 0.0
            cpa_value = cpa_micro / 1_000_000
        elif goal_cost_idx is not None and goal_cost_idx < len(fields) and conversions > 0:
            # Если есть GoalCost, считаем CPA = GoalCost / GoalConversions
            goal_cost_str = fields[goal_cost_idx]
            goal_cost_micro = float(goal_cost_str) if goal_cost_str and goal_cost_str != '--' else 0.0
            goal_cost = goal_cost_micro / 1_000_000
            cpa_value = goal_cost / conversions if conversions > 0 else 0.0
        elif conversions > 0:
            # Если ничего не пришло, считаем CPA вручную из общего Cost
            cpa_value = cost / conversions
        
        platform_dict = {
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'url': url,
            'impressions': impressions,
            'clicks': clicks,
            'cost': cost,
            'conversions': conversions,
            'ctr': ctr,
            'cpc': cpc,
            'cpa': cpa_value
        }
        platforms.append(platform_dict)
        
        # Логируем первые 3 площадки
        if len(platforms) <= 3:
            print(f'📊 Platform {len(platforms)}: {platform_dict}')
    
    return platforms