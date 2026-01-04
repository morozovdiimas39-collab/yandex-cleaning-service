import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import boto3
import requests

# Константы для расчёта батчей
AVG_TIME_PER_CAMPAIGN = 7  # секунд на обработку 1 кампании (по факту ~6-7 сек)
SAFE_TIMEOUT = 25  # 25 сек (Cloud Function timeout 30 сек с запасом)
BATCH_SIZE = 7  # 7 кампаний × 7 сек = ~49 сек, но с параллельной обработкой укладываемся в 25 сек

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Scheduler для автоматизации чистки площадок РСЯ (3 раза/день)
    Args: event - dict с httpMethod (CRON триггер или ручной запуск)
          context - объект с request_id
    Returns: HTTP response с количеством запланированных батчей
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
    
    # Проверяем параметр force_all для игнорирования расписания
    params = event.get('queryStringParameters') or {}
    force_all = params.get('force_all') == 'true'
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем проекты, которые нужно запустить
        print(f"🔍 Checking for projects to schedule at {datetime.now()} (force_all={force_all})")
        
        if force_all:
            # Игнорируем расписание — берём ВСЕ активные проекты
            cursor.execute("""
                SELECT 
                    s.id as schedule_id,
                    s.project_id,
                    s.interval_hours,
                    p.yandex_token,
                    p.campaign_ids
                FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule s
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = s.project_id
                WHERE s.is_active = TRUE
                  AND p.yandex_token IS NOT NULL
                ORDER BY s.project_id
                LIMIT 10
            """)
        else:
            # Обычный режим — по расписанию
            cursor.execute("""
                SELECT 
                    s.id as schedule_id,
                    s.project_id,
                    s.interval_hours,
                    p.yandex_token,
                    p.campaign_ids
                FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule s
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = s.project_id
                WHERE s.is_active = TRUE
                  AND s.next_run_at <= CURRENT_TIMESTAMP
                  AND p.yandex_token IS NOT NULL
                ORDER BY s.next_run_at
                LIMIT 5
            """)
        
        projects = cursor.fetchall()
        print(f"📊 Found {len(projects)} projects to schedule")
        
        if not projects:
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No projects to schedule',
                    'scheduled': 0
                })
            }
        
        total_batches = 0
        results = []
        
        for project in projects:
            try:
                batches_created = schedule_project(project, cursor, conn, context)
                total_batches += batches_created
                
                # Обновляем next_run_at
                cursor.execute("""
                    UPDATE t_p97630513_yandex_cleaning_serv.rsya_project_schedule
                    SET next_run_at = NOW() + make_interval(hours => %s),
                        last_run_at = NOW(),
                        updated_at = NOW()
                    WHERE id = %s
                """, (project['interval_hours'], project['schedule_id']))
                
                results.append({
                    'project_id': project['project_id'],
                    'batches_created': batches_created,
                    'status': 'success'
                })
                
            except Exception as e:
                print(f"❌ Error scheduling project {project['project_id']}: {str(e)}")
                results.append({
                    'project_id': project['project_id'],
                    'status': 'error',
                    'error': str(e)
                })
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Scheduled {len(projects)} projects, {total_batches} batches total")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'scheduled_projects': len(projects),
                'total_batches': total_batches,
                'results': results
            })
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Scheduler error: {str(e)}")
        print(f"❌ Traceback: {error_trace}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e), 'traceback': error_trace})
        }


def schedule_project(project: Dict[str, Any], cursor, conn, context: Any) -> int:
    '''
    Создаёт батчи кампаний для проекта и отправляет в Message Queue
    Returns: количество созданных батчей
    '''
    project_id = project['project_id']
    campaign_ids = project['campaign_ids']
    yandex_token = project['yandex_token']
    
    # Парсим campaign_ids если это строка
    if isinstance(campaign_ids, str):
        campaign_ids = json.loads(campaign_ids)
    
    if not campaign_ids:
        print(f"⚠️ Project {project_id} has no campaigns")
        return 0
    
    # Проверяем, что батчи не созданы недавно (защита от дублей)
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
        WHERE project_id = %s AND created_at > NOW() - INTERVAL '5 minutes'
    """, (project_id,))
    
    recent_batches = cursor.fetchone()['count']
    if recent_batches > 0:
        print(f"⚠️ Project {project_id} already has {recent_batches} batches created in last 5 minutes, skipping")
        return 0
    
    # Разбиваем на батчи
    batches = []
    for i in range(0, len(campaign_ids), BATCH_SIZE):
        batch = campaign_ids[i:i + BATCH_SIZE]
        batches.append(batch)
    
    total_batches = len(batches)
    print(f"📦 Project {project_id}: {len(campaign_ids)} campaigns → {total_batches} batches")
    
    # Сохраняем батчи в БД
    for batch_number, batch_campaign_ids in enumerate(batches, start=1):
        cursor.execute("""
            INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
            (project_id, campaign_ids, batch_number, total_batches, status)
            VALUES (%s, %s, %s, %s, 'pending')
            RETURNING id
        """, (
            project_id,
            json.dumps(batch_campaign_ids),
            batch_number,
            total_batches
        ))
        
        batch_id = cursor.fetchone()['id']
        
        batch_data = {
            'batch_id': batch_id,
            'project_id': project_id,
            'campaign_ids': batch_campaign_ids,
            'yandex_token': yandex_token,
            'batch_number': batch_number,
            'total_batches': total_batches
        }
        
        # Отправляем в Message Queue (для истории)
        send_to_mq(batch_data)
        
        # СРАЗУ вызываем Worker через HTTP (синхронно)
        invoke_worker_sync(batch_data)
    
    return total_batches


def send_to_mq(message: Dict[str, Any]) -> None:
    '''Отправка батча в Message Queue'''
    from botocore.config import Config
    
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gga4kkbv0csaelq94p/dj60000000b1egur05em/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    if not access_key or not secret_key:
        raise Exception('Message Queue credentials not configured')
    
    print(f"🔑 Using access key: {access_key[:8]}... (masked)")
    
    sqs = boto3.client(
        'sqs',
        endpoint_url='https://message-queue.api.cloud.yandex.net',
        region_name='ru-central1',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='v4')
    )
    
    print(f"📤 Sending batch {message['batch_number']}/{message['total_batches']} to queue...")
    
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message)
    )
    
    print(f"✅ Sent batch {message['batch_number']}/{message['total_batches']} to MQ (MessageId: {response.get('MessageId', 'N/A')})")


def invoke_worker_sync(batch_data: Dict[str, Any]) -> None:
    '''Синхронный вызов Worker через HTTP (для ручного запуска)'''
    worker_url = 'https://functions.poehali.dev/2642bac6-6d47-4fda-86e9-a10c458a2d81'
    
    try:
        print(f"🚀 Invoking Worker directly for batch {batch_data['batch_number']}/{batch_data['total_batches']}...")
        
        response = requests.post(
            worker_url,
            json=batch_data,
            headers={'Content-Type': 'application/json'},
            timeout=120  # 2 минуты таймаут (Worker может обрабатывать до 90 сек)
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Worker processed batch {batch_data['batch_number']}: {result.get('successful', 0)} successful, {result.get('failed', 0)} failed")
        else:
            print(f"⚠️ Worker returned status {response.status_code}: {response.text[:200]}")
    
    except requests.exceptions.Timeout:
        print(f"⏱️ Worker timeout for batch {batch_data['batch_number']} (still processing in background)")
    except Exception as e:
        print(f"❌ Failed to invoke Worker for batch {batch_data['batch_number']}: {str(e)}")