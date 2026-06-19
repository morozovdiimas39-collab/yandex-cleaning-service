import json
import os
import time
from typing import Dict, Any, List
import psycopg2
import psycopg2.extras
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Поллер для проверки async отчётов Яндекс.Директ (статус 201/202)
    Запускается по CRON каждые 5 минут
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
        
        # Получаем pending отчёты (не старше 24 часов)
        cursor.execute("""
            SELECT pr.id, pr.project_id, pr.task_id, pr.campaign_ids, 
                   pr.date_from::text, pr.date_to::text, pr.report_name,
                   p.yandex_token
            FROM t_p97630513_yandex_cleaning_serv.rsya_pending_reports pr
            JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = pr.project_id
            WHERE pr.status = 'pending'
              AND pr.created_at > NOW() - INTERVAL '24 hours'
            ORDER BY pr.created_at ASC
            LIMIT 20
        """)
        
        pending_reports = cursor.fetchall()
        
        if not pending_reports:
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No pending reports',
                    'checked': 0
                })
            }
        
        print(f'📊 Found {len(pending_reports)} pending reports')
        
        processed = 0
        ready = 0
        still_pending = 0
        failed = 0
        
        for report in pending_reports:
            try:
                result = check_and_process_report(report, cursor, conn)
                
                if result == 'ready':
                    ready += 1
                elif result == 'pending':
                    still_pending += 1
                elif result == 'failed':
                    failed += 1
                
                processed += 1
                
                # Задержка между запросами (лимит API)
                time.sleep(0.6)
                
            except Exception as e:
                print(f'❌ Error processing report {report["id"]}: {str(e)}')
                failed += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Processed {processed} reports: ready={ready}, pending={still_pending}, failed={failed}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'processed': processed,
                'ready': ready,
                'still_pending': still_pending,
                'failed': failed
            })
        }
        
    except Exception as e:
        print(f'❌ Poller error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def check_and_process_report(report: Dict[str, Any], cursor, conn) -> str:
    '''
    Проверяет готовность отчёта и обрабатывает его
    Returns: 'ready', 'pending', 'failed'
    '''
    report_id = report['id']
    project_id = report['project_id']
    task_id = report['task_id']
    token = report['yandex_token']
    campaign_ids = json.loads(report['campaign_ids']) if isinstance(report['campaign_ids'], str) else report['campaign_ids']
    date_from = report['date_from']
    date_to = report['date_to']
    report_name = report['report_name']
    
    print(f'🔍 Checking report {report_name} (id={report_id})')
    
    # Запрашиваем отчёт у Яндекса
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true',
        'skipColumnHeader': 'false'
    }
    
    report_data = {
        'params': {
            'SelectionCriteria': {
                'DateFrom': date_from,
                'DateTo': date_to,
                'Filter': [
                    {
                        'Field': 'CampaignId',
                        'Operator': 'IN',
                        'Values': [str(cid) for cid in campaign_ids]
                    }
                ]
            },
            'FieldNames': [
                'CampaignId',
                'Placement',
                'Cost',
                'Impressions',
                'Clicks',
                'Conversions',
                'Ctr',
                'AvgCpc'
            ],
            'ReportName': report_name,
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO'
        }
    }
    
    response = requests.post(
        'https://api.direct.yandex.com/json/v5/reports',
        json=report_data,
        headers=headers,
        timeout=30
    )
    
    print(f'📥 Response status: {response.status_code}')
    
    # Статус 200 — отчёт готов
    if response.status_code == 200:
        print(f'✅ Report {report_name} ready! Processing...')
        
        # Парсим TSV
        placements = parse_tsv_report(response.text)
        print(f'📊 Found {len(placements)} placements in report')
        
        if placements:
            # Получаем конфиг задачи для фильтрации
            cursor.execute("""
                SELECT config, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks
                WHERE id = %s
            """, (task_id,))
            
            task_row = cursor.fetchone()
            if not task_row:
                print(f'⚠️ Task {task_id} not found, skipping filtering')
                cursor.execute("""
                    UPDATE t_p97630513_yandex_cleaning_serv.rsya_pending_reports
                    SET status = 'completed', updated_at = NOW()
                    WHERE id = %s
                """, (report_id,))
                return 'failed'
            
            config = json.loads(task_row['config']) if isinstance(task_row['config'], str) else task_row['config']
            combine_operator = task_row.get('combine_operator') or 'AND'
            
            # Фильтруем площадки (используем локальную функцию ниже)
            matched = filter_placements(placements, config, combine_operator)
            print(f'✅ Matched {len(matched)} placements after filtering')
            
            # Добавляем в block_queue
            added = 0
            for placement in matched:
                try:
                    cursor.execute("""
                        INSERT INTO t_p97630513_yandex_cleaning_serv.block_queue 
                        (task_id, campaign_id, domain, status, attempts, project_id, clicks, cost, conversions, cpa)
                        VALUES (%s, %s, %s, 'pending', 0, %s, %s, %s, %s, %s)
                        ON CONFLICT (task_id, campaign_id, domain) DO UPDATE
                        SET clicks = EXCLUDED.clicks,
                            cost = EXCLUDED.cost,
                            conversions = EXCLUDED.conversions,
                            cpa = EXCLUDED.cpa,
                            attempts = 0
                    """, (
                        task_id,
                        placement['campaign_id'],
                        placement['domain'],
                        project_id,
                        placement.get('clicks', 0),
                        placement.get('cost', 0),
                        placement.get('conversions', 0),
                        placement.get('cpa', 0)
                    ))
                    added += 1
                except Exception as e:
                    print(f'❌ Error adding to queue: {str(e)}')
            
            print(f'✅ Added {added} placements to block_queue')
            
            # Отправляем в MQ
            if added > 0:
                send_to_message_queue(matched, project_id)
                
                # Запускаем worker
                try:
                    worker_url = os.environ.get('RSYA_BLOCK_WORKER_URL', 'https://functions.yandexcloud.net/d4ecp99plhc7m6v6h0n6')
                    requests.post(worker_url, json={}, timeout=1)
                    print('🚀 Triggered worker')
                except:
                    pass
        
        # Помечаем отчёт как completed
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_pending_reports
            SET status = 'completed', updated_at = NOW()
            WHERE id = %s
        """, (report_id,))
        
        return 'ready'
    
    # Статус 201/202 — отчёт ещё формируется
    elif response.status_code in [201, 202]:
        print(f'⏳ Report {report_name} still pending (status {response.status_code})')
        return 'pending'
    
    # Другие ошибки
    else:
        print(f'❌ Error fetching report: {response.status_code}, {response.text[:500]}')
        
        # Помечаем как failed после 3 часов
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_pending_reports
            SET status = 'failed', updated_at = NOW()
            WHERE id = %s AND created_at < NOW() - INTERVAL '3 hours'
        """, (report_id,))
        
        return 'failed'


def parse_tsv_report(tsv_data: str) -> List[Dict]:
    '''Парсит TSV отчёт в список площадок'''
    lines = tsv_data.strip().split('\n')
    if not lines:
        return []
    
    # Первая строка - заголовки
    headers_line = lines[0].split('\t')
    
    placements = []
    for line in lines[1:]:
        values = line.split('\t')
        if len(values) != len(headers_line):
            continue
        
        row = dict(zip(headers_line, values))
        
        # Пропускаем пустые площадки
        if not row.get('Placement') or row['Placement'] == '--':
            continue
        
        ctr_value = float(row.get('Ctr', 0)) if row.get('Ctr') and row.get('Ctr') != '--' else 0.0
        cpc_micro = float(row.get('AvgCpc', 0)) if row.get('AvgCpc') and row.get('AvgCpc') != '--' else 0.0
        cpc_value = cpc_micro / 1_000_000
        cost = float(row.get('Cost', 0))
        conversions = int(row.get('Conversions', 0))
        
        placement = {
            'campaign_id': int(row['CampaignId']),
            'domain': row['Placement'],
            'cost': cost,
            'impressions': int(row.get('Impressions', 0)),
            'clicks': int(row.get('Clicks', 0)),
            'conversions': conversions,
            'ctr': ctr_value,
            'cpc': cpc_value,
            'cpa': cost / conversions if conversions else 0
        }
        
        placements.append(placement)
    
    return placements


def _normalize_list(value) -> List[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [item.strip().lower() for item in value.split(',') if item.strip()]
    return [str(item).strip().lower() for item in value if str(item).strip()]


def _domain_matches_keyword(domain: str, keyword: str) -> bool:
    if '.' in keyword:
        return domain.startswith(keyword)
    return keyword in domain


def matches_task_filters(platform: Dict, config: Dict, combine_operator: str = 'AND') -> bool:
    '''Та же логика, что в rsya-batch-worker: exceptions/protect first, затем AND/OR условия.'''
    domain = platform['domain'].lower()
    combine_operator = (combine_operator or config.get('combine_operator') or 'AND').upper()

    exceptions = _normalize_list(config.get('exceptions', []))
    if exceptions and any(exc in domain for exc in exceptions):
        return False

    if config.get('protect_conversions') and platform.get('conversions', 0) > 0:
        return False

    conditions = []

    keywords = _normalize_list(config.get('keywords', []))
    if keywords:
        conditions.append(any(_domain_matches_keyword(domain, kw) for kw in keywords))

    metric_rules = [
        ('min_impressions', lambda value: platform.get('impressions', 0) >= value),
        ('max_impressions', lambda value: platform.get('impressions', 0) <= value),
        ('min_clicks', lambda value: platform.get('clicks', 0) >= value),
        ('max_clicks', lambda value: platform.get('clicks', 0) <= value),
        ('min_cpc', lambda value: platform.get('cpc', 0) >= value),
        ('max_cpc', lambda value: platform.get('cpc', 0) <= value),
        ('min_ctr', lambda value: platform.get('ctr', 0) >= value),
        ('max_ctr', lambda value: platform.get('ctr', 0) <= value),
        ('min_conversions', lambda value: platform.get('conversions', 0) >= value),
        ('min_cpa', lambda value: platform.get('cpa', 0) >= value),
        ('max_cpa', lambda value: platform.get('cpa', 0) <= value),
    ]

    for key, predicate in metric_rules:
        value = config.get(key)
        if value is not None:
            conditions.append(predicate(value))

    if not conditions:
        return False

    if combine_operator == 'OR':
        return any(conditions)
    return all(conditions)


def filter_placements(placements: List[Dict], config: Dict, combine_operator: str = 'AND') -> List[Dict]:
    '''Фильтрация площадок единым правилом с batch worker.'''
    matched = []
    for placement in placements:
        if matches_task_filters(placement, config, combine_operator):
            matched.append(placement)
    return matched


def send_to_message_queue(placements: List[Dict], project_id: int):
    '''Отправка в MQ'''
    import boto3
    
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gga4kkbv0csaelq94p/dj60000000b1egur05em/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    if not access_key or not secret_key:
        print('❌ MQ credentials not configured')
        return
    
    sqs = boto3.client(
        'sqs',
        endpoint_url='https://message-queue.api.cloud.yandex.net',
        region_name='ru-central1',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )
    
    # Батчами по 10
    batch_size = 10
    for i in range(0, len(placements), batch_size):
        batch = placements[i:i + batch_size]
        
        message_body = json.dumps({
            'project_id': project_id,
            'placements': batch
        })
        
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=message_body
        )
    
    print(f'✅ Sent {len(placements)} placements to MQ')
