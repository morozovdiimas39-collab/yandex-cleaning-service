import json
import os
import time
import re
from typing import Dict, Any, List
import psycopg2
import psycopg2.extras
import requests
import boto3

BATCH_SIZE = 50  # Обрабатываем 50 площадок за раз

def process_from_database_fallback(dsn: str) -> Dict[str, Any]:
    '''Fallback: обработка pending площадок напрямую из БД когда MQ пустая'''
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Читаем pending площадки с приоритетом (лимит 50)
        cursor.execute("""
            SELECT bq.id, bq.task_id, bq.campaign_id, bq.domain, bq.project_id,
                   bq.clicks, bq.cost, bq.conversions, bq.cpa
            FROM t_p97630513_yandex_cleaning_serv.block_queue bq
            WHERE bq.status = 'pending'
            ORDER BY bq.cost DESC, bq.clicks DESC
            LIMIT 50
        """)
        
        pending_items = cursor.fetchall()
        
        if not pending_items:
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'processed': 0, 'message': 'No pending placements in DB'})
            }
        
        print(f'📦 Found {len(pending_items)} pending placements in database')
        
        # Группируем по project_id и campaign_id
        projects_map = {}
        for item in pending_items:
            project_id = item['project_id']
            campaign_id = item['campaign_id']
            
            if project_id not in projects_map:
                projects_map[project_id] = {}
            
            if campaign_id not in projects_map[project_id]:
                projects_map[project_id][campaign_id] = []
            
            projects_map[project_id][campaign_id].append({
                'task_id': item['task_id'],
                'campaign_id': str(campaign_id),
                'domain': item['domain'],
                'clicks': item['clicks'],
                'cost': float(item['cost']) if item['cost'] else 0,
                'conversions': item['conversions'],
                'cpa': float(item['cpa']) if item['cpa'] else 0
            })
        
        processed_total = 0
        blocked_total = 0
        failed_total = 0
        
        # Обрабатываем каждый проект
        for project_id, campaigns_map in projects_map.items():
            # Получаем токен проекта
            cursor.execute("""
                SELECT yandex_token FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s
            """, (project_id,))
            
            project = cursor.fetchone()
            if not project or not project['yandex_token']:
                print(f'❌ Project {project_id} not found or no token')
                continue
            
            token = project['yandex_token']
            
            # Обрабатываем каждую кампанию
            for campaign_id, placements in campaigns_map.items():
                result = block_placements_batch(
                    token, campaign_id, placements, cursor, conn, project_id
                )
                processed_total += result['processed']
                blocked_total += result['blocked']
                failed_total += result['failed']
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ DB Fallback completed: processed={processed_total}, blocked={blocked_total}, failed={failed_total}')
        
        # Self-triggering если обработали хоть что-то
        if processed_total > 0:
            try:
                worker_url = os.environ.get('RSYA_BLOCK_WORKER_URL', 'https://functions.yandexcloud.net/d4ecp99plhc7m6v6h0n6')
                requests.post(worker_url, json={}, timeout=1)
                print('🔄 Triggered next worker iteration (DB fallback)')
            except:
                pass
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'processed': processed_total,
                'blocked': blocked_total,
                'failed': failed_total,
                'source': 'database_fallback'
            })
        }
        
    except Exception as e:
        print(f'❌ Database fallback error: {str(e)}')
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        except:
            pass
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Database fallback failed: {str(e)}'})
        }


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
    Business: Worker для обработки батчей площадок из Message Queue (self-polling)
    Args: event - dict с httpMethod
          context - объект с request_id
    Returns: HTTP response dict с количеством обработанных площадок
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Читаем сообщения из Message Queue
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gga4kkbv0csaelq94p/dj60000000b1egur05em/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    if not access_key or not secret_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Message Queue credentials not configured'})
        }
    
    try:
        sqs = boto3.client(
            'sqs',
            endpoint_url='https://message-queue.api.cloud.yandex.net',
            region_name='ru-central1',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
        
        # Читаем до 10 сообщений
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=1,
            VisibilityTimeout=300
        )
        
        messages = response.get('Messages', [])
        
        if not messages:
            print('📭 MQ empty, checking database for pending placements...')
            # Fallback: читаем из БД если MQ пустая
            dsn = os.environ.get('DATABASE_URL')
            if dsn:
                try:
                    return process_from_database_fallback(dsn)
                except Exception as db_err:
                    print(f'❌ Database fallback failed: {str(db_err)}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'processed': 0, 'message': 'Queue empty, no pending in DB'})
            }
        
        print(f'📬 Received {len(messages)} messages from Message Queue')
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Failed to read from queue: {str(e)}'})
        }
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        processed_total = 0
        blocked_total = 0
        failed_total = 0
        
        # Обрабатываем каждое сообщение
        for msg in messages:
            receipt_handle = msg.get('ReceiptHandle')
            
            try:
                body = json.loads(msg.get('Body', '{}'))
                project_id = body.get('project_id')
                placements = body.get('placements', [])
                
                if not project_id or not placements:
                    print(f'⚠️ Invalid message format')
                    # Удаляем невалидное сообщение
                    if receipt_handle:
                        sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                    continue
                
                # Получаем токен проекта
                cursor.execute("""
                    SELECT yandex_token, user_id 
                    FROM t_p97630513_yandex_cleaning_serv.rsya_projects 
                    WHERE id = %s
                """, (project_id,))
                
                project = cursor.fetchone()
                if not project or not project['yandex_token']:
                    print(f'❌ Project {project_id} not found or no token')
                    # Удаляем сообщение с несуществующим проектом
                    if receipt_handle:
                        sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                    continue
                
                token = project['yandex_token']
                
                # Группируем площадки по campaign_id
                campaigns_map = {}
                for placement in placements:
                    campaign_id = placement['campaign_id']
                    if campaign_id not in campaigns_map:
                        campaigns_map[campaign_id] = []
                    campaigns_map[campaign_id].append(placement)
                
                # Обрабатываем каждую кампанию
                for campaign_id, campaign_placements in campaigns_map.items():
                    result = block_placements_batch(
                        token, campaign_id, campaign_placements, cursor, conn, project_id
                    )
                    processed_total += result['processed']
                    blocked_total += result['blocked']
                    failed_total += result['failed']
                
                # Удаляем обработанное сообщение
                if receipt_handle:
                    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                    print(f'🗑️ Deleted message from queue')
                
            except Exception as e:
                print(f'❌ Error processing message: {str(e)}')
                failed_total += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ Batch completed: processed={processed_total}, blocked={blocked_total}, failed={failed_total}')
        
        # Self-triggering: вызываем себя снова если обработали messages
        if len(messages) > 0:
            try:
                # Вызываем worker снова через HTTP (асинхронно)
                worker_url = os.environ.get('RSYA_BLOCK_WORKER_URL', 'https://functions.yandexcloud.net/d4ecp99plhc7m6v6h0n6')
                requests.post(worker_url, json={}, timeout=1)
                print('🔄 Triggered next worker iteration')
            except:
                pass  # Ignore timeout/errors, worker вызовется через automation
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'processed': processed_total,
                'blocked': blocked_total,
                'failed': failed_total,
                'messages_count': len(messages)
            })
        }
        
    except Exception as e:
        print(f'❌ Error in worker handler: {str(e)}')
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        except:
            pass
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def block_placements_for_campaign(
    token: str, 
    campaign_id: int, 
    task_id: int, 
    items: List[Dict], 
    cursor, 
    conn
) -> Dict[str, int]:
    '''Блокировка площадок для одной кампании'''
    
    print(f'🎯 Campaign {campaign_id}: processing {len(items)} placements')
    
    # Получаем текущий список ExcludedSites из Яндекса
    current_excluded = get_excluded_sites(token, campaign_id)
    
    if current_excluded is None:
        print(f'❌ Failed to fetch ExcludedSites for campaign {campaign_id}')
        return {'processed': 0, 'blocked': 0, 'failed': len(items)}
    
    print(f'🔍 Current excluded list: {current_excluded[:10]}')
    
    # Рассчитываем сколько мест доступно (лимит 950 вместо 1000 для ротации)
    soft_limit = 950
    current_count = len(current_excluded)
    available_slots = max(0, soft_limit - current_count)
    
    print(f'📊 Campaign {campaign_id}: Current blocked={current_count}, Requested={len(items)} (unique={len(set([i["domain"] for i in items]))}), Will add={min(available_slots, len(items))}')
    
    # Если лимит достигнут - пропускаем
    if available_slots == 0:
        print(f'⛔ Campaign {campaign_id}: LIMIT REACHED ({current_count}/{soft_limit}+). Skipping addition, waiting for daily rotation.')
        
        # Помечаем площадки как failed (rotation их освободит)
        for item in items:
            cursor.execute("""
                UPDATE t_p97630513_yandex_cleaning_serv.block_queue 
                SET status = 'failed', 
                    attempts = attempts + 1,
                    error_message = 'Campaign at limit, waiting for rotation'
                WHERE id = %s
            """, (item['id'],))
        
        return {'processed': len(items), 'blocked': 0, 'failed': len(items)}
    
    # Фильтруем домены которых еще нет в списке
    current_excluded_set = set(current_excluded)
    domains_to_add = []
    already_blocked_items = []
    
    for item in items:
        domain = item['domain']
        if domain not in current_excluded_set:
            domains_to_add.append(domain)
        else:
            already_blocked_items.append(item)
    
    # Уже заблокированные - удалим позже после успешного обновления
    
    print(f'📝 Domains to add: {domains_to_add[:10]}')
    
    if not domains_to_add:
        print(f'✅ All {len(items)} placements already blocked')
        return {'processed': len(items), 'blocked': 0, 'failed': 0}
    
    # Ограничиваем количество добавляемых доменов
    domains_to_add = domains_to_add[:available_slots]
    
    # Добавляем новые домены (используем set чтобы гарантировать уникальность)
    new_excluded_list = list(set(list(current_excluded_set) + domains_to_add))
    
    print(f'📝 New excluded list size: {len(new_excluded_list)} (current: {len(current_excluded)}, adding: {len(domains_to_add)})')
    
    # Обновляем в Яндексе
    success = update_excluded_sites(token, campaign_id, new_excluded_list)
    
    if success:
        # УДАЛЯЕМ из очереди (не completed!)
        blocked_count = 0
        for item in items:
            if item['domain'] in domains_to_add:
                cursor.execute("""
                    DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE id = %s
                """, (item['id'],))
                blocked_count += 1
        
        # Удаляем уже заблокированные
        for item in already_blocked_items:
            cursor.execute("""
                DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE id = %s
            """, (item['id'],))
        
        print(f'✅ Blocked {blocked_count} placements in campaign {campaign_id}, deleted {len(already_blocked_items)} already blocked')
        return {'processed': len(items), 'blocked': blocked_count, 'failed': 0}
    else:
        # Increment attempts, но НЕ failed (retry автоматически)
        for item in items:
            if item['domain'] in domains_to_add:
                cursor.execute("""
                    UPDATE t_p97630513_yandex_cleaning_serv.block_queue 
                    SET attempts = attempts + 1,
                        error_message = 'Failed to update ExcludedSites'
                    WHERE id = %s AND attempts < 3
                """, (item['id'],))
                # Удаляем если >= 3 попытки
                cursor.execute("""
                    DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE id = %s AND attempts >= 3
                """, (item['id'],))
        
        print(f'❌ Batch failed: Failed to update ExcludedSites')
        return {'processed': len(items), 'blocked': 0, 'failed': len(items)}


def block_placements_batch(
    token: str, 
    campaign_id: int, 
    placements: List[Dict], 
    cursor, 
    conn,
    project_id: int
) -> Dict[str, int]:
    '''Блокировка батча площадок для одной кампании (из Message Queue)'''
    
    print(f'🎯 Campaign {campaign_id}: processing {len(placements)} placements from MQ')
    
    # Получаем текущий список ExcludedSites из Яндекса
    current_excluded = get_excluded_sites(token, campaign_id)
    
    # КРИТИЧНО: Если кампания не ACCEPTED (archived, moderation, etc) - удаляем из очереди и пропускаем
    if current_excluded == 'UNMODIFIABLE':
        print(f'🗑️ Campaign {campaign_id} cannot be modified, removing {len(placements)} placements from queue')
        for placement in placements:
            cursor.execute("""
                DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue 
                WHERE project_id = %s 
                  AND campaign_id = %s 
                  AND domain = %s
            """, (project_id, campaign_id, placement['domain']))
        return {'processed': len(placements), 'blocked': 0, 'failed': 0}
    
    if current_excluded is None:
        print(f'❌ Failed to fetch ExcludedSites for campaign {campaign_id}')
        return {'processed': 0, 'blocked': 0, 'failed': len(placements)}
    
    # Лимит 950
    soft_limit = 950
    current_count = len(current_excluded)
    available_slots = max(0, soft_limit - current_count)
    
    if available_slots == 0:
        print(f'⛔ Campaign {campaign_id}: LIMIT REACHED')
        return {'processed': len(placements), 'blocked': 0, 'failed': len(placements)}
    
    # Фильтруем домены которых еще нет (КРИТИЧНО: lowercase для дедупликации)
    current_excluded_normalized = [d.lower() for d in current_excluded]
    current_excluded_set = set(current_excluded_normalized)
    domains_to_add_set = set()
    
    for placement in placements:
        domain_normalized = placement['domain'].lower()
        if domain_normalized not in current_excluded_set:
            domains_to_add_set.add(domain_normalized)
    
    domains_to_add = list(domains_to_add_set)
    
    if not domains_to_add:
        print(f'✅ All {len(placements)} placements already blocked')
        # Удаляем из block_queue
        for placement in placements:
            cursor.execute("""
                DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue 
                WHERE project_id = %s 
                  AND campaign_id = %s 
                  AND domain = %s
            """, (project_id, campaign_id, placement['domain']))
        return {'processed': len(placements), 'blocked': 0, 'failed': 0}
    
    # Ограничиваем
    domains_to_add = domains_to_add[:available_slots]
    
    # Добавляем новые домены (дедуплицируем через set, все lowercase)
    new_excluded_list = list(set(current_excluded_normalized + domains_to_add))
    
    print(f'📝 New excluded list size: {len(new_excluded_list)} (current: {len(current_excluded)}, adding: {len(domains_to_add)})')
    
    # Обновляем в Яндексе
    success = update_excluded_sites(token, campaign_id, new_excluded_list)
    
    if success:
        # УДАЛЯЕМ из block_queue
        for placement in placements:
            if placement['domain'] in domains_to_add or placement['domain'] in current_excluded_set:
                cursor.execute("""
                    DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue 
                    WHERE project_id = %s 
                      AND campaign_id = %s 
                      AND domain = %s
                """, (project_id, campaign_id, placement['domain']))
        
        print(f'✅ Blocked {len(domains_to_add)} placements in campaign {campaign_id}')
        return {'processed': len(placements), 'blocked': len(domains_to_add), 'failed': 0}
    else:
        print(f'❌ Failed to update ExcludedSites')
        return {'processed': len(placements), 'blocked': 0, 'failed': len(placements)}


def get_excluded_sites(token: str, campaign_id: int):
    '''Получение списка ExcludedSites из Яндекс.Директ (возвращает список доменов или 'ARCHIVED')'''
    
    try:
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'get',
                'params': {
                    'SelectionCriteria': {
                        'Ids': [campaign_id]
                    },
                    'FieldNames': ['Id', 'ExcludedSites', 'Status']
                }
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code != 200:
            print(f'Yandex API error: {response.status_code}, {response.text}')
            return None
        
        data = response.json()
        campaigns = data.get('result', {}).get('Campaigns', [])
        
        if not campaigns:
            return []
        
        # ПРОВЕРЯЕМ СТАТУС КАМПАНИИ (можно модифицировать только ACCEPTED)
        campaign_status = campaigns[0].get('Status', 'UNKNOWN')
        if campaign_status != 'ACCEPTED':
            print(f'⚠️ Campaign {campaign_id} has status {campaign_status}, cannot be modified (only ACCEPTED can)')
            return 'UNMODIFIABLE'  # Специальное значение для неактивных кампаний
        
        excluded_sites_obj = campaigns[0].get('ExcludedSites', {})
        excluded = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
        
        # КРИТИЧНО: Дедуплицируем список сразу, чтобы избежать ошибки 9802 при обратной отправке
        deduplicated = list(dict.fromkeys(excluded)) if excluded else []
        
        if len(excluded) != len(deduplicated):
            print(f'⚠️ Removed {len(excluded) - len(deduplicated)} duplicates from current ExcludedSites (was {len(excluded)}, now {len(deduplicated)})')
        
        return deduplicated
        
    except Exception as e:
        print(f'Error fetching ExcludedSites: {str(e)}')
        return None


def update_excluded_sites(token: str, campaign_id: int, excluded_sites: List[str]) -> bool:
    '''Обновление списка ExcludedSites в Яндекс.Директ'''
    
    try:
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'update',
                'params': {
                    'Campaigns': [{
                        'Id': campaign_id,
                        'ExcludedSites': {
                            'Items': excluded_sites
                        }
                    }]
                }
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code != 200:
            print(f'❌ Yandex API HTTP {response.status_code}: {response.text[:500]}')
            return False
        
        data = response.json()
        print(f'📥 Yandex API response: {json.dumps(data, ensure_ascii=False)[:1000]}')
        
        # Проверяем что обновление прошло успешно
        if 'result' in data:
            update_results = data['result'].get('UpdateResults', [])
            if update_results and 'Id' in update_results[0]:
                print(f'✅ Campaign {campaign_id} updated successfully')
                return True
        
        # Если есть ошибки
        if 'error' in data:
            print(f'❌ Yandex API error response: {json.dumps(data["error"], ensure_ascii=False)}')
        else:
            print(f'❌ Unexpected Yandex API response format (no result, no error)')
        
        return False
        
    except Exception as e:
        print(f'Error updating ExcludedSites: {str(e)}')
        return False