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
BATCH_SIZE = int(os.environ.get('RSYA_CAMPAIGN_BATCH_SIZE', '7'))
SCHEDULER_PROJECT_LIMIT = int(os.environ.get('RSYA_SCHEDULER_PROJECT_LIMIT', '50'))
SCHEDULER_FORCE_PROJECT_LIMIT = int(os.environ.get('RSYA_SCHEDULER_FORCE_PROJECT_LIMIT', '100'))
VALID_PROJECT_FILTER = """
                  AND p.is_configured = TRUE
                  AND p.campaign_ids IS NOT NULL
                  AND NULLIF(BTRIM(p.campaign_ids), '') IS NOT NULL
                  AND p.campaign_ids <> '[]'
                  AND EXISTS (
                      SELECT 1
                      FROM t_p97630513_yandex_cleaning_serv.rsya_tasks t
                      WHERE t.project_id = p.id
                        AND t.enabled = TRUE
                  )
"""

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
    
    # Проверяем параметры
    params = event.get('queryStringParameters') or {}
    force_all = params.get('force_all') == 'true'
    target_project_id = params.get('project_id')
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем проекты, которые нужно запустить
        print(f"🔍 Checking for projects to schedule at {datetime.now()} (force_all={force_all}, project_id={target_project_id})")
        
        if target_project_id:
            # Запуск конкретного проекта (для кнопки "Запустить сейчас")
            cursor.execute("""
                SELECT 
                    s.id as schedule_id,
                    s.project_id,
                    s.interval_hours,
                    p.yandex_token,
                    p.campaign_ids,
                    p.client_login,
                    p.auto_add_campaigns
                FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule s
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = s.project_id
                WHERE s.project_id = %s
                  AND s.is_active = TRUE
                  AND p.yandex_token IS NOT NULL
                  {valid_project_filter}
            """.format(valid_project_filter=VALID_PROJECT_FILTER), (int(target_project_id),))
        elif force_all:
            # Игнорируем расписание — берём ВСЕ активные проекты
            cursor.execute("""
                SELECT 
                    s.id as schedule_id,
                    s.project_id,
                    s.interval_hours,
                    p.yandex_token,
                    p.campaign_ids,
                    p.client_login,
                    p.auto_add_campaigns
                FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule s
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = s.project_id
                WHERE s.is_active = TRUE
                  AND p.yandex_token IS NOT NULL
                  {valid_project_filter}
                ORDER BY s.project_id
                LIMIT %s
            """.format(valid_project_filter=VALID_PROJECT_FILTER), (SCHEDULER_FORCE_PROJECT_LIMIT,))
        else:
            # Обычный режим — по расписанию
            cursor.execute("""
                SELECT 
                    s.id as schedule_id,
                    s.project_id,
                    s.interval_hours,
                    p.yandex_token,
                    p.campaign_ids,
                    p.client_login,
                    p.auto_add_campaigns
                FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule s
                JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = s.project_id
                WHERE s.is_active = TRUE
                  AND s.next_run_at <= CURRENT_TIMESTAMP
                  AND p.yandex_token IS NOT NULL
                  {valid_project_filter}
                ORDER BY s.next_run_at
                LIMIT %s
            """.format(valid_project_filter=VALID_PROJECT_FILTER), (SCHEDULER_PROJECT_LIMIT,))
        
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
                batches_created = schedule_project(project, cursor, conn, context, force_all=force_all)
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


def schedule_project(project: Dict[str, Any], cursor, conn, context: Any, force_all: bool = False) -> int:
    '''
    Создаёт батчи кампаний для проекта и отправляет в Message Queue
    Returns: количество созданных батчей
    '''
    project_id = project['project_id']
    campaign_ids = parse_campaign_ids(project.get('campaign_ids'))
    yandex_token = project['yandex_token']
    client_login = (project.get('client_login') or '').strip()

    if is_truthy(project.get('auto_add_campaigns')):
        campaign_ids = merge_auto_added_rsya_campaigns(project_id, campaign_ids, yandex_token, client_login, cursor)
    
    # Один campaign_id — один батч, иначе воркеры разных батчей дерутся за одни и те же кампании (locked by another worker)
    campaign_ids = list(dict.fromkeys(campaign_ids))
    
    if not campaign_ids:
        print(f"⚠️ Project {project_id} has no campaigns")
        return 0
    
    if force_all:
        cursor.execute("""
            DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
            WHERE project_id = %s
        """, (project_id,))
        print(f"🗑️ Project {project_id}: cleared existing batches (force_all)")
    else:
        # Не создаём новые батчи, если есть свежие (последние 5 минут)
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
            WHERE project_id = %s AND created_at > NOW() - INTERVAL '5 minutes'
        """, (project_id,))
        if cursor.fetchone()['count'] > 0:
            print(f"⚠️ Project {project_id} already has batches in last 5 minutes, skipping")
            return 0
        # Удаляем ВСЕ батчи проекта, иначе при INSERT будет duplicate key
        cursor.execute("""
            DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
            WHERE project_id = %s
        """, (project_id,))
        if cursor.rowcount and cursor.rowcount > 0:
            print(f"🗑️ Project {project_id}: cleared {cursor.rowcount} batches")
    
    # Сбрасываем локи кампаний этого проекта, чтобы новый запуск не упирался в старые (от прошлого run/499)
    if campaign_ids:
        cursor.execute("""
            DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_locks
            WHERE campaign_id = ANY(%s)
        """, ([str(c) for c in campaign_ids],))
        if cursor.rowcount and cursor.rowcount > 0:
            print(f"🔓 Project {project_id}: cleared {cursor.rowcount} campaign locks")
        conn.commit()
    
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
            'client_login': client_login,
            'batch_number': batch_number,
            'total_batches': total_batches
        }
        
        # Отправляем в MQ — воркер вызовется триггером. HTTP с timeout=0.5 приводил к 499 (клиент рвал соединение → платформа отменяла вызов).
        send_to_mq(batch_data)
    
    return total_batches


def parse_campaign_ids(raw_campaign_ids: Any) -> List[str]:
    '''Нормализует campaign_ids из БД и не даёт черновикам ломать scheduler.'''
    if raw_campaign_ids is None:
        return []
    if isinstance(raw_campaign_ids, str):
        raw_campaign_ids = raw_campaign_ids.strip()
        if not raw_campaign_ids:
            return []
        parsed = json.loads(raw_campaign_ids)
    else:
        parsed = raw_campaign_ids
    if not isinstance(parsed, list):
        return []
    return [str(campaign_id).strip() for campaign_id in parsed if str(campaign_id).strip()]


def is_truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in ('1', 'true', 'yes', 'y', 'on')


def get_bidding_strategy(campaign: Dict[str, Any]) -> Dict[str, Any]:
    for key in ('TextCampaign', 'DynamicTextCampaign', 'SmartCampaign', 'UnifiedCampaign', 'CpmBannerCampaign', 'MobileAppCampaign'):
        nested = campaign.get(key) or {}
        strategy = nested.get('BiddingStrategy') or {}
        if strategy:
            return strategy
    return {}


def get_campaign_channel(campaign: Dict[str, Any]) -> str:
    strategy = get_bidding_strategy(campaign)
    network_strategy = (strategy.get('Network') or {}).get('BiddingStrategyType')
    search_strategy = (strategy.get('Search') or {}).get('BiddingStrategyType')
    campaign_type = campaign.get('Type')

    network_enabled = bool(network_strategy and network_strategy != 'SERVING_OFF')
    if not network_enabled:
        return ''
    if campaign_type == 'UNIFIED_CAMPAIGN':
        return 'ТК'
    if campaign_type in ('DYNAMIC_TEXT_CAMPAIGN', 'SMART_CAMPAIGN'):
        return 'РСЯ'
    if campaign_type == 'TEXT_CAMPAIGN':
        if search_strategy == 'SERVING_OFF':
            return 'РСЯ'
        if search_strategy:
            return 'МК'
        return 'РСЯ'
    return 'РСЯ'


def is_network_enabled_campaign(campaign: Dict[str, Any]) -> bool:
    strategy = get_bidding_strategy(campaign)
    network_strategy = (strategy.get('Network') or {}).get('BiddingStrategyType')
    return bool(network_strategy and network_strategy != 'SERVING_OFF')


def fetch_current_rsya_campaign_ids(yandex_token: str, client_login: str) -> List[str]:
    headers = {
        'Authorization': f'Bearer {yandex_token}',
        'Accept-Language': 'ru'
    }
    if client_login:
        headers['Client-Login'] = client_login

    payload = {
        'method': 'get',
        'params': {
            'SelectionCriteria': {},
            'FieldNames': ['Id', 'Name', 'Type', 'Status', 'State'],
            'TextCampaignFieldNames': ['BiddingStrategy'],
            'DynamicTextCampaignFieldNames': ['BiddingStrategy'],
            'SmartCampaignFieldNames': ['BiddingStrategy'],
            'UnifiedCampaignFieldNames': ['BiddingStrategy'],
            'MobileAppCampaignFieldNames': ['BiddingStrategy'],
            'CpmBannerCampaignFieldNames': ['BiddingStrategy']
        }
    }

    response = requests.post(
        'https://api.direct.yandex.com/json/v5/campaigns',
        headers=headers,
        json=payload,
        timeout=30
    )
    response.raise_for_status()
    data = response.json()
    if data.get('error'):
        raise Exception(data['error'].get('error_detail') or data['error'].get('error_string') or 'Direct API error')

    campaigns = ((data.get('result') or {}).get('Campaigns') or [])
    return [
        str(campaign.get('Id')).strip()
        for campaign in campaigns
        if (
            campaign.get('Id')
            and is_network_enabled_campaign(campaign)
            and campaign.get('Status') != 'DRAFT'
            and campaign.get('State') == 'ON'
        )
    ]


def merge_auto_added_rsya_campaigns(
    project_id: int,
    stored_campaign_ids: List[str],
    yandex_token: str,
    client_login: str,
    cursor
) -> List[str]:
    try:
        current_rsya_ids = fetch_current_rsya_campaign_ids(yandex_token, client_login)
    except Exception as exc:
        print(f"⚠️ Project {project_id}: failed to refresh RSYA campaigns for auto-add: {exc}")
        return stored_campaign_ids

    merged_campaign_ids = list(dict.fromkeys([*stored_campaign_ids, *current_rsya_ids]))
    new_campaign_ids = [campaign_id for campaign_id in current_rsya_ids if campaign_id not in set(stored_campaign_ids)]
    if new_campaign_ids:
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_projects
            SET campaign_ids = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(merged_campaign_ids), project_id))
        print(f"➕ Project {project_id}: auto-added {len(new_campaign_ids)} RSYA campaigns")

    return merged_campaign_ids


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
    '''Асинхронный вызов Worker через HTTP (fire-and-forget)'''
    worker_url = os.environ.get('RSYA_BATCH_WORKER_URL', 'https://functions.yandexcloud.net/d4eq5hst4mn9mmcttib1')
    
    try:
        print(f"🚀 Invoking Worker for batch {batch_data['batch_number']}/{batch_data['total_batches']} (async)...")
        
        # Fire-and-forget: таймаут 0.5 сек, НЕ ЖДЁМ обработки
        requests.post(
            worker_url,
            json=batch_data,
            headers={'Content-Type': 'application/json'},
            timeout=0.5  # Отправили запрос и сразу идём дальше
        )
        
        print(f"✅ Worker invoked for batch {batch_data['batch_number']}")
    
    except requests.exceptions.Timeout:
        # Это НОРМАЛЬНО — Worker получил запрос и обрабатывает в фоне
        print(f"✅ Worker started processing batch {batch_data['batch_number']} (async)")
    except Exception as e:
        print(f"⚠️ Failed to invoke Worker for batch {batch_data['batch_number']}: {str(e)}")
