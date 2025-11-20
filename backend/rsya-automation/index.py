import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import requests
import boto3

BATCH_SIZE = 2  # Обрабатываем 2 проекта за раз (быстрее, избегаем таймаута)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Автоматическая проверка и блокировка площадок РСЯ по задачам (батчинг по проектам)
    Args: event - dict с httpMethod (GET для ручного запуска, TIMER для крона)
          context - объект с request_id
    Returns: HTTP response dict с результатами выполнения
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # ТЕСТОВЫЙ РЕЖИМ: ?test=1 - отправляет тестовые данные в MQ
    query_params = event.get('queryStringParameters', {}) or {}
    if query_params.get('test') == '1':
        print('🧪 TEST MODE: Sending test data to Message Queue')
        test_placements = [
            {'campaign_id': 12345, 'domain': 'test-mq.com', 'cost': 100, 'clicks': 50, 'conversions': 0, 'priority': 100, 'metadata': {}},
            {'campaign_id': 12345, 'domain': 'test-mq2.com', 'cost': 200, 'clicks': 100, 'conversions': 0, 'priority': 200, 'metadata': {}}
        ]
        send_to_message_queue(test_placements, 999)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'mode': 'test', 'sent_placements': len(test_placements)})
        }
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Task-Id',
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
        
        # Получаем последний обработанный project_id
        cursor.execute("""
            SELECT value FROM automation_state WHERE key = 'rsya_automation_last_project_id'
        """)
        state = cursor.fetchone()
        last_project_id = state['value']['project_id'] if state else 0
        
        # Получаем следующую порцию проектов
        cursor.execute("""
            SELECT DISTINCT p.id, p.user_id, p.yandex_token, p.campaign_ids, p.counter_ids
            FROM rsya_projects p
            JOIN rsya_tasks t ON t.project_id = p.id
            WHERE p.id > %s 
              AND t.enabled = true 
              AND p.yandex_token IS NOT NULL
            ORDER BY p.id
            LIMIT %s
        """, (last_project_id, BATCH_SIZE))
        
        projects = cursor.fetchall()
        
        if not projects:
            # Начинаем сначала
            print(f'🔄 Reached end of projects, resetting to start')
            cursor.execute("""
                UPDATE automation_state 
                SET value = '{"project_id": 0}'::jsonb, updated_at = NOW()
                WHERE key = 'rsya_automation_last_project_id'
            """)
            conn.commit()
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Batch cycle completed, reset to start',
                    'processed': 0
                })
            }
        
        results = []
        total_tasks = 0
        
        # Обрабатываем каждый проект
        for project in projects:
            try:
                project_result = process_project(project, cursor, conn, context)
                results.append(project_result)
                total_tasks += project_result.get('tasks_processed', 0)
            except Exception as e:
                print(f'❌ Error processing project {project["id"]}: {str(e)}')
                results.append({
                    'project_id': project['id'],
                    'status': 'error',
                    'error': str(e)
                })
        
        # Сохраняем прогресс
        last_processed_id = projects[-1]['id']
        cursor.execute("""
            UPDATE automation_state 
            SET value = %s::jsonb, updated_at = NOW()
            WHERE key = 'rsya_automation_last_project_id'
        """, (json.dumps({'project_id': last_processed_id}),))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Processed {len(projects)} projects, {total_tasks} tasks. Last ID: {last_processed_id}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'processed_projects': len(projects),
                'processed_tasks': total_tasks,
                'last_project_id': last_processed_id,
                'results': results
            })
        }
        
    except Exception as e:
        print(f'❌ Error in automation handler: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def process_project(project: Dict[str, Any], cursor, conn, context: Any) -> Dict[str, Any]:
    '''Обработка всех задач одного проекта'''
    
    project_id = project['id']
    
    # Получаем все активные задачи проекта
    cursor.execute("""
        SELECT t.id, t.project_id, t.description, t.config, t.enabled, t.last_executed_at
        FROM rsya_tasks t
        WHERE t.project_id = %s AND t.enabled = true
        ORDER BY t.id
    """, (project_id,))
    
    tasks = cursor.fetchall()
    
    if not tasks:
        return {
            'project_id': project_id,
            'status': 'no_tasks',
            'tasks_processed': 0
        }
    
    print(f'📦 Project {project_id}: processing {len(tasks)} tasks')
    
    task_results = []
    for task in tasks:
        try:
            result = process_task(task, project, cursor, conn, context)
            task_results.append(result)
        except Exception as e:
            print(f'❌ Error processing task {task["id"]}: {str(e)}')
            task_results.append({
                'task_id': task['id'],
                'status': 'error',
                'error': str(e)
            })
    
    return {
        'project_id': project_id,
        'status': 'success',
        'tasks_processed': len(tasks),
        'task_results': task_results
    }


def process_task(task: Dict[str, Any], project: Dict[str, Any], cursor, conn, context: Any) -> Dict[str, Any]:
    '''Обработка одной задачи: получение площадок, фильтрация, блокировка'''
    
    task_id = task['id']
    project_id = task['project_id']
    yandex_token = project['yandex_token']
    campaign_ids = project['campaign_ids']
    counter_ids = project['counter_ids']
    config = task['config']
    
    print(f'Processing task {task_id}: {task["description"]}')
    
    # Создаём запись о начале выполнения
    cursor.execute("""
        INSERT INTO rsya_cleaning_execution_logs 
        (execution_type, project_id, task_id, status, request_id, started_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        RETURNING id
    """, ('automation', project_id, task_id, 'running', context.request_id))
    
    execution_log_id = cursor.fetchone()['id']
    conn.commit()
    
    try:
        placements_found = 0
        placements_matched = 0
        placements_sent = 0
        
        # Парсим campaign_ids если это строка JSON
        if isinstance(campaign_ids, str):
            campaign_ids = json.loads(campaign_ids)
        
        # Парсим counter_ids если это строка JSON
        if isinstance(counter_ids, str):
            counter_ids = json.loads(counter_ids)
        
        # Парсим конфигурацию задачи
        if isinstance(config, str):
            config = json.loads(config)
        
        # Если нет конфигурации - пропускаем задачу
        if not config:
            print(f'Task {task_id} has no config, skipping')
            return {
                'task_id': task_id,
                'status': 'no_config',
                'message': 'Task has no configuration'
            }
        
        # Получаем список площадок УЖЕ ЗАБЛОКИРОВАННЫХ в Яндексе
        yandex_blocked = fetch_already_blocked_placements(yandex_token, campaign_ids)
        print(f'🔍 Task {task_id}: {len(yandex_blocked)} platforms already blocked in Yandex')
        
        goals_to_fetch = []
        if config.get('goal_id') and config['goal_id'] != 'all':
            all_goals = fetch_metrika_goals(yandex_token, counter_ids) if counter_ids else []
            goals_to_fetch = [g for g in all_goals if str(g.get('id')) == str(config['goal_id'])]
        
        # Получаем площадки из Яндекс Директа
        config_with_ids = {**config, 'project_id': project_id, 'task_id': task_id}
        placements = fetch_placements_from_yandex(yandex_token, campaign_ids, goals_to_fetch, config_with_ids)
        
        if not placements:
            return {
                'task_id': task_id,
                'status': 'no_placements',
                'message': 'No placements found'
            }
        
        # Фильтруем площадки по критериям задачи
        matched_placements = filter_placements(placements, config)
        
        if not matched_placements:
            return {
                'task_id': task_id,
                'status': 'no_matches',
                'total_placements': len(placements),
                'message': 'No placements matched filters'
            }
        
        # Получаем список площадок уже в очереди
        already_in_queue = set()
        cursor.execute("""
            SELECT DISTINCT task_id, campaign_id, domain
            FROM block_queue 
            WHERE task_id = %s
        """, (task_id,))
        queue_items = cursor.fetchall()
        for row in queue_items:
            already_in_queue.add(f"{row['campaign_id']}:{row['domain']}")
        
        # Исключаем площадки уже в Яндексе ИЛИ в очереди
        placements_to_queue = []
        skipped_blocked = 0
        skipped_queue = 0
        for placement in matched_placements:
            campaign_id = placement['campaign_id']
            domain = placement['domain']
            key = f"{campaign_id}:{domain}"
            
            if key in yandex_blocked:
                skipped_blocked += 1
            elif key in already_in_queue:
                skipped_queue += 1
            else:
                placements_to_queue.append(placement)
        
        print(f'📊 Matched: {len(matched_placements)}, Already blocked in Yandex: {skipped_blocked}, In queue: {skipped_queue}, NEW: {len(placements_to_queue)}')
        
        if not placements_to_queue:
            return {
                'task_id': task_id,
                'status': 'already_blocked',
                'total_placements': len(placements),
                'matched': len(matched_placements),
                'message': 'All matched placements are already blocked'
            }
        
        # Добавляем в очередь блокировки
        added_count = 0
        for placement in placements_to_queue:
            try:
                cursor.execute("""
                    INSERT INTO block_queue (task_id, campaign_id, domain, status, attempts, project_id, clicks, cost, conversions)
                    VALUES (%s, %s, %s, 'pending', 0, %s, %s, %s, %s)
                    ON CONFLICT (task_id, campaign_id, domain) DO UPDATE
                    SET clicks = EXCLUDED.clicks,
                        cost = EXCLUDED.cost,
                        conversions = EXCLUDED.conversions,
                        attempts = 0
                """, (
                    task_id,
                    placement['campaign_id'],
                    placement['domain'],
                    project_id,
                    placement.get('clicks', 0),
                    placement.get('cost', 0),
                    placement.get('conversions', 0)
                ))
                added_count += 1
            except Exception as e:
                print(f'Error adding to queue: {str(e)}')
        
        conn.commit()
        print(f'✅ Added {added_count} NEW placements to blocking queue')
        
        # Отправляем сообщения в Message Queue батчами по 10
        if added_count > 0:
            send_to_message_queue(placements_to_queue, project_id)
            
            # Запускаем worker для обработки
            try:
                worker_url = 'https://functions.poehali.dev/eec1c17a-e079-4e13-983b-12132a3888fd'
                requests.post(worker_url, json={}, timeout=1)
                print('🚀 Triggered worker to process queue')
            except Exception:
                pass  # Ignore timeout, worker запустится
        
        # Обновляем execution_log после успешного выполнения
        cursor.execute("""
            UPDATE rsya_cleaning_execution_logs 
            SET status = 'success',
                completed_at = NOW(),
                placements_found = %s,
                placements_matched = %s,
                placements_sent_to_queue = %s
            WHERE id = %s
        """, (len(placements), len(matched_placements), added_count, execution_log_id))
        conn.commit()
        
        return {
            'task_id': task_id,
            'status': 'success',
            'total_placements': len(placements),
            'matched': len(matched_placements),
            'queued': added_count
        }
    except Exception as e:
        # Логируем ошибку
        print(f'❌ Error in process_task: {str(e)}')
        cursor.execute("""
            UPDATE rsya_cleaning_execution_logs 
            SET status = 'error',
                completed_at = NOW(),
                error_message = %s
            WHERE id = %s
        """, (str(e), execution_log_id))
        conn.commit()
        raise


def save_pending_report(project_id: int, task_id: int, campaign_ids: List[int], date_from: str, date_to: str, report_name: str):
    '''Сохранение pending отчёта в БД для async обработки'''
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        print('❌ save_pending_report: DATABASE_URL not configured')
        return
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO rsya_pending_reports 
            (project_id, task_id, campaign_ids, date_from, date_to, report_name, status, retry_count)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', 0)
        """, (
            project_id,
            task_id,
            json.dumps(campaign_ids),
            date_from,
            date_to,
            report_name
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Saved pending report: {report_name} (project={project_id}, campaigns={len(campaign_ids)})')
    except Exception as e:
        print(f'❌ Error saving pending report: {str(e)}')


def fetch_placements_from_yandex(token: str, campaign_ids: List[int], goals: List[Dict], config: Dict) -> List[Dict]:
    '''Получение площадок из Яндекс.Директ API Reports v5 (батчами по 5 кампаний)'''
    
    # По умолчанию берем последние 30 дней
    today = datetime.now()
    default_from = (today - timedelta(days=30)).strftime('%Y-%m-%d')
    default_to = today.strftime('%Y-%m-%d')
    
    date_from = config.get('date_from', default_from)
    date_to = config.get('date_to', default_to)
    
    # Формируем колонки для запроса (только базовые для онлайн-режима)
    columns = [
        'CampaignId',
        'Placement',
        'Cost',
        'Impressions',
        'Clicks',
        'Conversions'
    ]
    
    # Добавляем поля цели если указана
    goal_ids = []
    if goals:
        goal_ids = [g['id'] for g in goals]
        columns.extend(['GoalConversions', 'GoalCost'])
    
    all_placements = []
    batch_size = 5
    
    print(f'📊 Total campaigns: {len(campaign_ids)}, will process in batches of {batch_size}')
    if goal_ids:
        print(f'🎯 Goals filter: {goal_ids}')
    
    # Обрабатываем кампании батчами по 5 штук
    for i in range(0, len(campaign_ids), batch_size):
        batch_campaigns = campaign_ids[i:i + batch_size]
        
        print(f'📦 Batch {i // batch_size + 1}: campaigns {batch_campaigns} from {date_from} to {date_to}')
        
        report_data = {
            'params': {
                'SelectionCriteria': {
                    'DateFrom': date_from,
                    'DateTo': date_to,
                    'Filter': [
                        {
                            'Field': 'CampaignId',
                            'Operator': 'IN',
                            'Values': [str(cid) for cid in batch_campaigns]
                        }
                    ]
                },
                'FieldNames': columns,
                'ReportName': f'RSYAPlacements_{datetime.now().strftime("%Y%m%d_%H%M%S")}_batch{i // batch_size + 1}',
                'ReportType': 'CUSTOM_REPORT',
                'DateRangeType': 'CUSTOM_DATE',
                'Format': 'TSV',
                'IncludeVAT': 'NO',
                'IncludeDiscount': 'NO'
            }
        }
        
        # Добавляем Goals если указаны
        if goal_ids:
            report_data['params']['Goals'] = goal_ids
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept-Language': 'ru',
            'returnMoneyInMicros': 'false',
            'skipReportHeader': 'true',
            'skipReportSummary': 'true',
            'skipColumnHeader': 'false'
        }
        
        print(f'📤 Sending batch {i // batch_size + 1} request to Yandex API...')
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/reports',
            json=report_data,
            headers=headers
        )
        
        print(f'📥 Batch {i // batch_size + 1} response status: {response.status_code}')
        
        if response.status_code == 201 or response.status_code == 202:
            # Сохраняем запрос в БД для async обработки
            report_name = report_data['params']['ReportName']
            status_msg = 'being created (201)' if response.status_code == 201 else 'still processing (202)'
            print(f'⏳ Batch {i // batch_size + 1}: Report {status_msg}. Saving to pending_reports table')
            
            save_pending_report(
                project_id=config.get('project_id'),
                task_id=config.get('task_id'),
                campaign_ids=batch_campaigns,
                date_from=date_from,
                date_to=date_to,
                report_name=report_name
            )
            continue
        
        if response.status_code != 200:
            print(f'❌ Batch {i // batch_size + 1}: Yandex API error: {response.status_code}')
            print(f'❌ Response text: {response.text[:1000]}')
            continue
        
        print(f'✅ Batch {i // batch_size + 1}: Report ready! Response length: {len(response.text)} bytes')
        
        # Парсим TSV ответ
        lines = response.text.strip().split('\n')
        if not lines:
            continue
        
        # Первая строка - заголовки
        headers_line = lines[0].split('\t')
        
        for line in lines[1:]:
            values = line.split('\t')
            if len(values) != len(headers_line):
                continue
            
            row = dict(zip(headers_line, values))
            
            # Пропускаем строки с пустыми площадками
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
            
            # Добавляем goal conversions если есть
            if 'GoalConversions' in row:
                placement['goal_conversions'] = int(row.get('GoalConversions', 0))
            if 'GoalCost' in row:
                placement['goal_cost'] = float(row.get('GoalCost', 0))
            
            all_placements.append(placement)
    
    print(f'✅ Total placements collected from all batches: {len(all_placements)}')
    return all_placements


def filter_placements(placements: List[Dict], config: Dict) -> List[Dict]:
    '''Фильтрация площадок по критериям задачи'''
    
    matched = []
    min_cost = config.get('min_cost', 0)
    max_ctr = config.get('max_ctr', 100)
    max_cpa = config.get('max_cpa')
    keywords = config.get('keywords', [])
    exceptions = config.get('exceptions', [])
    
    if isinstance(keywords, str):
        keywords = [k.strip().lower() for k in keywords.split(',') if k.strip()]
    
    if isinstance(exceptions, str):
        exceptions = [k.strip().lower() for k in exceptions.split(',') if k.strip()]
    
    for placement in placements:
        domain = placement['domain'].lower()
        cost = placement['cost']
        clicks = placement['clicks']
        impressions = placement['impressions']
        conversions = placement.get('conversions', 0)
        
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        cpa = (cost / conversions) if conversions > 0 else 0
        
        has_exception = any(exc in domain for exc in exceptions)
        if has_exception:
            continue
        
        if cost < min_cost:
            continue
        
        if ctr > max_ctr:
            continue
        
        if max_cpa and conversions > 0 and cpa > max_cpa:
            continue
        
        if keywords:
            has_keyword = any(keyword in domain for keyword in keywords)
            if not has_keyword:
                continue
        
        placement['priority'] = int(cost)
        placement['metadata'] = {
            'ctr': round(ctr, 2),
            'cpa': round(cpa, 2) if conversions > 0 else None
        }
        
        matched.append(placement)
    
    return matched


def fetch_metrika_goals(token: str, counter_ids: List[int]) -> List[Dict]:
    '''Получение списка целей из Яндекс.Метрики'''
    
    goals = []
    
    for counter_id in counter_ids:
        try:
            response = requests.get(
                f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}/goals',
                headers={'Authorization': f'OAuth {token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                goals.extend(data.get('goals', []))
        except Exception as e:
            print(f'Error fetching goals for counter {counter_id}: {str(e)}')
    
    return goals


def fetch_already_blocked_placements(token: str, campaign_ids: List[int]) -> set:
    '''Получение уже заблокированных площадок из Яндекс.Директ'''
    
    blocked = set()
    
    for campaign_id in campaign_ids:
        try:
            response = requests.post(
                'https://api.direct.yandex.com/json/v5/campaigns',
                json={
                    'method': 'get',
                    'params': {
                        'SelectionCriteria': {
                            'Ids': [campaign_id]
                        },
                        'FieldNames': ['Id', 'ExcludedSites']
                    }
                },
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('result', {}).get('Campaigns', [])
                
                for campaign in campaigns:
                    excluded_sites_obj = campaign.get('ExcludedSites', {})
                    excluded = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
                    for site in excluded:
                        blocked.add(f"{campaign_id}:{site}")
                        
                print(f'Campaign {campaign_id} has {len(excluded)} blocked sites (sample: {excluded[:3]})')
        except Exception as e:
            print(f'Error fetching blocked sites for campaign {campaign_id}: {str(e)}')
    
    print(f'📋 Found {len(blocked)} already blocked placements across {len(campaign_ids)} campaigns')
    return blocked


def send_to_message_queue(placements: List[Dict], project_id: int):
    '''Отправка площадок в Yandex Message Queue батчами по 10'''
    
    print(f'🚀 send_to_message_queue CALLED: project_id={project_id}, placements={len(placements)}')
    
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gtcrip05he61994ldo/dj600000007lh09q06il/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    print(f'🔑 Credentials: access_key={access_key[:10] if access_key else "MISSING"}..., secret_key={secret_key[:10] if secret_key else "MISSING"}...')
    
    if not access_key or not secret_key:
        print('❌ Message Queue credentials not configured')
        return
    
    print(f'📡 Creating SQS client...')
    try:
        sqs = boto3.client(
            'sqs',
            endpoint_url='https://message-queue.api.cloud.yandex.net',
            region_name='ru-central1',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
        print(f'✅ SQS client created')
        
        # Отправляем батчами по 10 площадок
        batch_size = 10
        sent_count = 0
        batches_total = (len(placements) + batch_size - 1) // batch_size
        
        print(f'📦 Sending {len(placements)} placements in {batches_total} batches...')
        
        for i in range(0, len(placements), batch_size):
            batch = placements[i:i + batch_size]
            
            message_body = json.dumps({
                'project_id': project_id,
                'placements': batch
            })
            
            print(f'📤 Sending batch {i // batch_size + 1}/{batches_total} ({len(batch)} placements)...')
            
            response = sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=message_body
            )
            
            message_id = response.get('MessageId', 'NO_ID')
            print(f'✅ Batch sent! MessageId={message_id}')
            
            sent_count += len(batch)
        
        print(f'✅✅✅ SUCCESS! Sent {sent_count} placements to Message Queue in {batches_total} batches')
        
    except Exception as e:
        print(f'❌❌❌ ERROR sending to Message Queue: {type(e).__name__}: {str(e)}')
        import traceback
        print(f'❌ Traceback: {traceback.format_exc()}')