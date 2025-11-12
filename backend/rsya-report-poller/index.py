import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import requests

MAX_RETRIES = 10
RETRY_INTERVAL_MINUTES = 5

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Async поллер для проверки готовности отчётов Яндекс Директ (201/202 → 200)
    Args: event - dict с httpMethod
          context - объект с request_id
    Returns: HTTP response dict с результатами обработки
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
        
        # Получаем pending отчёты (не проверявшиеся > 5 минут или новые)
        retry_threshold = datetime.now() - timedelta(minutes=RETRY_INTERVAL_MINUTES)
        
        cursor.execute("""
            SELECT id, project_id, task_id, campaign_ids, date_from, date_to, report_name, retry_count
            FROM rsya_pending_reports
            WHERE status = 'pending' 
              AND retry_count < %s
              AND (last_attempt_at IS NULL OR last_attempt_at < %s)
            ORDER BY created_at ASC
            LIMIT 20
        """, (MAX_RETRIES, retry_threshold))
        
        pending_reports = cursor.fetchall()
        
        if not pending_reports:
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No pending reports to check',
                    'checked': 0
                })
            }
        
        print(f'📋 Found {len(pending_reports)} pending reports to check')
        
        results = {
            'checked': 0,
            'ready': 0,
            'still_pending': 0,
            'failed': 0
        }
        
        for report in pending_reports:
            result = process_pending_report(report, cursor, conn)
            results['checked'] += 1
            
            if result['status'] == 'ready':
                results['ready'] += 1
            elif result['status'] == 'pending':
                results['still_pending'] += 1
            else:
                results['failed'] += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Poller completed: {results}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'results': results
            })
        }
        
    except Exception as e:
        print(f'❌ Error in report poller: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def process_pending_report(report: Dict[str, Any], cursor, conn) -> Dict[str, str]:
    '''Проверка готовности одного отчёта и обработка если готов'''
    
    report_id = report['id']
    project_id = report['project_id']
    task_id = report['task_id']
    campaign_ids = json.loads(report['campaign_ids'])
    date_from = report['date_from'].strftime('%Y-%m-%d')
    date_to = report['date_to'].strftime('%Y-%m-%d')
    report_name = report['report_name']
    retry_count = report['retry_count']
    
    print(f'🔍 Checking report {report_id}: {report_name} (retry {retry_count}/{MAX_RETRIES})')
    
    # Получаем токен проекта
    cursor.execute("SELECT yandex_token FROM rsya_projects WHERE id = %s", (project_id,))
    project_row = cursor.fetchone()
    
    if not project_row or not project_row['yandex_token']:
        print(f'❌ Project {project_id} not found or no token')
        cursor.execute("""
            UPDATE rsya_pending_reports 
            SET status = 'failed', error_message = 'Project not found or no token',
                last_attempt_at = NOW()
            WHERE id = %s
        """, (report_id,))
        return {'status': 'failed', 'reason': 'no_token'}
    
    token = project_row['yandex_token']
    
    # Запрашиваем отчёт повторно
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
                'Conversions'
            ],
            'ReportName': report_name,
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO'
        }
    }
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept-Language': 'ru',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true',
        'skipColumnHeader': 'false'
    }
    
    try:
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/reports',
            json=report_data,
            headers=headers,
            timeout=60
        )
        
        print(f'📥 Report {report_id} response: {response.status_code}')
        
        if response.status_code == 200:
            # Отчёт готов! Обрабатываем данные
            placements = parse_tsv_report(response.text)
            print(f'✅ Report {report_id} ready! Got {len(placements)} placements')
            
            # Сохраняем площадки в rsya_platform_stats
            saved_count = save_placements_to_db(placements, project_id, cursor)
            
            # Помечаем отчёт как completed
            cursor.execute("""
                UPDATE rsya_pending_reports 
                SET status = 'completed', completed_at = NOW(), last_attempt_at = NOW()
                WHERE id = %s
            """, (report_id,))
            
            # Если есть task_id - запускаем фильтрацию и блокировку
            if task_id:
                trigger_task_execution(task_id, project_id)
            
            return {'status': 'ready', 'placements': len(placements), 'saved': saved_count}
            
        elif response.status_code == 201 or response.status_code == 202:
            # Всё ещё генерируется
            print(f'⏳ Report {report_id} still processing ({response.status_code})')
            cursor.execute("""
                UPDATE rsya_pending_reports 
                SET retry_count = retry_count + 1, last_attempt_at = NOW()
                WHERE id = %s
            """, (report_id,))
            return {'status': 'pending'}
            
        else:
            # Ошибка
            error_msg = response.text[:500]
            print(f'❌ Report {report_id} error: {response.status_code} - {error_msg}')
            
            cursor.execute("""
                UPDATE rsya_pending_reports 
                SET retry_count = retry_count + 1, 
                    last_attempt_at = NOW(),
                    error_message = %s,
                    status = CASE WHEN retry_count + 1 >= %s THEN 'failed' ELSE 'pending' END
                WHERE id = %s
            """, (error_msg, MAX_RETRIES, report_id))
            
            return {'status': 'failed', 'reason': f'http_{response.status_code}'}
            
    except Exception as e:
        print(f'❌ Error checking report {report_id}: {str(e)}')
        cursor.execute("""
            UPDATE rsya_pending_reports 
            SET retry_count = retry_count + 1, 
                last_attempt_at = NOW(),
                error_message = %s,
                status = CASE WHEN retry_count + 1 >= %s THEN 'failed' ELSE 'pending' END
            WHERE id = %s
        """, (str(e), MAX_RETRIES, report_id))
        return {'status': 'failed', 'reason': 'exception'}


def parse_tsv_report(tsv_text: str) -> List[Dict]:
    '''Парсинг TSV отчёта Яндекса'''
    lines = tsv_text.strip().split('\n')
    if not lines:
        return []
    
    headers_line = lines[0].split('\t')
    placements = []
    
    for line in lines[1:]:
        values = line.split('\t')
        if len(values) != len(headers_line):
            continue
        
        row = dict(zip(headers_line, values))
        
        if not row.get('Placement') or row['Placement'] == '--':
            continue
        
        placement = {
            'campaign_id': int(row['CampaignId']),
            'domain': row['Placement'],
            'cost': float(row.get('Cost', 0)),
            'impressions': int(row.get('Impressions', 0)),
            'clicks': int(row.get('Clicks', 0)),
            'conversions': int(row.get('Conversions', 0))
        }
        
        placements.append(placement)
    
    return placements


def save_placements_to_db(placements: List[Dict], project_id: int, cursor) -> int:
    '''Сохранение площадок в rsya_platform_stats'''
    if not placements:
        return 0
    
    saved = 0
    for p in placements:
        try:
            cursor.execute("""
                INSERT INTO rsya_platform_stats 
                (project_id, campaign_id, url, impressions, clicks, cost, conversions, status, date_from, date_to)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', CURRENT_DATE - 30, CURRENT_DATE)
                ON CONFLICT (project_id, campaign_id, url, date_from, date_to) 
                DO UPDATE SET
                    impressions = EXCLUDED.impressions,
                    clicks = EXCLUDED.clicks,
                    cost = EXCLUDED.cost,
                    conversions = EXCLUDED.conversions,
                    status = EXCLUDED.status
            """, (
                project_id,
                p['campaign_id'],
                p['domain'],
                p['impressions'],
                p['clicks'],
                p['cost'],
                p['conversions']
            ))
            saved += 1
        except Exception as e:
            print(f'⚠️ Error saving placement {p["domain"]}: {str(e)}')
    
    return saved


def trigger_task_execution(task_id: int, project_id: int):
    '''Триггер запуска automation для обработки новых площадок'''
    try:
        automation_url = 'https://functions.poehali.dev/d26aaae5-ffb1-46ce-bc94-e692335fdfda'
        requests.post(automation_url, json={}, timeout=1)
        print(f'🚀 Triggered automation for task {task_id}')
    except:
        pass  # Ignore timeout
