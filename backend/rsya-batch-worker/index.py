import json
import logging
import os
import sys
import time
import io
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import boto3  # нужен в рантайме при вызове по триггеру MQ
import psycopg2
import psycopg2.extras
import requests

# Retry настройки
RETRY_DELAYS = [5, 10, 20, 40, 60]  # Exponential backoff
MAX_WAIT_FOR_429 = 60  # Максимум ждём 60 сек при 429
API_DELAY = 0.6  # Задержка между API запросами (лимит: 20 req / 10 sec)


def mark_batch_failed_fresh_conn(batch_id: int, error_message: str) -> bool:
    """Обновить статус батча на failed через новое подключение (если основное мёртвое, напр. при 499)."""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return False
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
            SET status = 'failed', error_message = %s, retry_count = retry_count + 1
            WHERE id = %s
        """, (error_message[:500], batch_id))
        conn.close()
        return True
    except Exception as e:
        print(f"❌ mark_batch_failed_fresh_conn: {e}")
        return False


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Worker для обработки батча кампаний (чистка площадок РСЯ)
    Args: event - dict с batch_id, project_id, campaign_ids, yandex_token
          context - объект с request_id
    Returns: HTTP response с результатами обработки
    '''
    # Платформа может не показывать stdout — дублируем в stderr и logging
    msg = "[RSYA-BATCH-WORKER] handler invoked"
    print(msg, flush=True)
    print(msg, file=sys.stderr, flush=True)
    logging.getLogger().setLevel(logging.INFO)
    logging.info(msg)
    sys.stdout.flush()
    sys.stderr.flush()
    
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*'
            },
            'body': ''
        }
    
    # Получаем данные из body (от Message Queue или прямого вызова)
    # Message Queue триггер передаёт в messages[0].details.message.body
    if 'messages' in event:
        # Триггер от Message Queue
        message_body = event['messages'][0]['details']['message']['body']
        data = json.loads(message_body)
    else:
        # Прямой вызов (для тестов) — читаем из БД
        body_str = event.get('body', '{}')
        if not body_str or body_str == '{}' or body_str.strip() == '':
            # DB FALLBACK: читаем pending батчи из базы
            print('📭 Empty body, checking database for pending batches...')
            return process_from_database()
        data = json.loads(body_str) if isinstance(body_str, str) else body_str
    
    batch_id = data.get('batch_id')
    project_id = data.get('project_id')
    campaign_ids = data.get('campaign_ids', [])
    yandex_token = data.get('yandex_token')
    
    if not all([batch_id, project_id, campaign_ids, yandex_token]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required parameters'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    start_time = time.time()
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Забираем батч только если он ещё pending (чтобы один батч не обрабатывали несколько воркеров)
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
            SET status = 'processing', started_at = NOW()
            WHERE id = %s AND status = 'pending'
        """, (batch_id,))
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            print(f"⏭️ Batch {batch_id} already taken by another worker, skipping", flush=True)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'batch_id': batch_id,
                    'skipped': True,
                    'reason': 'batch_already_processing'
                })
            }
        
        # Очищаем устаревшие локи (от отменённых/упавших прошлых запусков), чтобы кампании были доступны
        cursor.execute("""
            DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_locks 
            WHERE expires_at < NOW()
        """)
        cleared = cursor.rowcount
        conn.commit()
        if cleared > 0:
            print(f"🔓 Cleared {cleared} expired campaign locks", flush=True)
        
        print(f"📦 rsya-batch-worker: processing batch {batch_id}, {len(campaign_ids)} campaigns", flush=True)
        # Обрабатываем каждую кампанию в батче
        results = []
        for campaign_id in campaign_ids:
            try:
                result = process_campaign(
                    campaign_id, 
                    yandex_token, 
                    project_id,
                    cursor, 
                    conn, 
                    context
                )
                results.append(result)
            except Exception as e:
                print(f"❌ Error processing campaign {campaign_id}: {str(e)}")
                try:
                    conn.rollback()
                except Exception:
                    pass
                results.append({
                    'campaign_id': campaign_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Подсчитываем статистику
        successful = sum(1 for r in results if r.get('status') == 'success')
        failed = sum(1 for r in results if r.get('status') == 'error')
        skipped = sum(1 for r in results if r.get('status') == 'skipped')
        total_blocked = sum(r.get('blocked', 0) or 0 for r in results)
        
        processing_time = int(time.time() - start_time)
        
        # Обновляем статус батча
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
            SET status = 'completed',
                completed_at = NOW(),
                processing_time_sec = %s
            WHERE id = %s
        """, (processing_time, batch_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        summary = f"✅ Batch {batch_id}: {successful} success, {failed} failed, {skipped} skipped | blocked in Yandex: {total_blocked} ({processing_time}s)"
        print(summary, flush=True)
        print(summary, file=sys.stderr, flush=True)
        logging.info(summary)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'batch_id': batch_id,
                'project_id': project_id,
                'campaigns_processed': len(campaign_ids),
                'successful': successful,
                'failed': failed,
                'skipped': skipped,
                'processing_time_sec': processing_time
            })
        }
        
    except Exception as e:
        print(f"❌ Batch worker error: {str(e)}")
        
        # Откатываем транзакцию если она открыта
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        
        # Пытаемся обновить статус батча в БД (сначала текущее подключение, при ошибке — новое)
        updated = False
        if conn and cursor:
            try:
                cursor.execute("""
                    UPDATE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
                    SET status = 'failed',
                        error_message = %s,
                        retry_count = retry_count + 1
                    WHERE id = %s
                """, (str(e)[:500], batch_id))
                conn.commit()
                updated = True
            except Exception as db_error:
                print(f"❌ Failed to update batch status: {str(db_error)}")
                try:
                    conn.rollback()
                except Exception:
                    pass
        if not updated and batch_id:
            updated = mark_batch_failed_fresh_conn(batch_id, str(e))
        if not updated:
            print(f"⚠️ Could not mark batch {batch_id} as failed in DB")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def process_campaign(
    campaign_id: str, 
    yandex_token: str, 
    project_id: int,
    cursor, 
    conn, 
    context: Any
) -> Dict[str, Any]:
    '''
    Обработка одной кампании: получение площадок, фильтрация по задачам, блокировка
    '''
    
    # Батч уже забран одним воркером (UPDATE pending→processing), дубли кампаний убираются в планировщике — локи на уровне кампании не нужны
    try:
        # 2. Получаем активные задачи проекта
        cursor.execute("""
            SELECT id, description, config, combine_operator
            FROM t_p97630513_yandex_cleaning_serv.rsya_tasks
            WHERE project_id = %s AND enabled = TRUE
        """, (project_id,))
        tasks = cursor.fetchall()
        
        if not tasks:
            print(f"⚠️ No active tasks for project {project_id}")
            return {
                'campaign_id': campaign_id,
                'status': 'skipped',
                'reason': 'no_active_tasks'
            }
        
        print(f"📋 Found {len(tasks)} active tasks for project {project_id}")
        first_task_id = tasks[0]['id']
        selected_goal_ids = collect_selected_goal_ids(tasks)
        if selected_goal_ids:
            print(f"🎯 Project {project_id}: loading Direct reports for goals {selected_goal_ids}", flush=True)
        
        # 3. Получаем площадки за 3 периода (сегодня, вчера, 7 дней)
        platforms_today = get_platforms_with_retry(campaign_id, yandex_token, 0, 0, cursor, conn, project_id, first_task_id)
        platforms_yesterday = get_platforms_with_retry(campaign_id, yandex_token, 1, 1, cursor, conn, project_id, first_task_id)
        platforms_7d = get_platforms_with_retry(campaign_id, yandex_token, 7, 0, cursor, conn, project_id, first_task_id)

        goal_platform_sets = []
        if selected_goal_ids:
            goal_platform_sets = [
                get_platforms_with_retry(campaign_id, yandex_token, 0, 0, cursor, conn, project_id, first_task_id, selected_goal_ids),
                get_platforms_with_retry(campaign_id, yandex_token, 1, 1, cursor, conn, project_id, first_task_id, selected_goal_ids),
                get_platforms_with_retry(campaign_id, yandex_token, 7, 0, cursor, conn, project_id, first_task_id, selected_goal_ids),
            ]
        
        # Если все отчёты async (201/202) → пропускаем (обработает поллер)
        if platforms_today is None and platforms_yesterday is None and platforms_7d is None:
            return {
                'campaign_id': campaign_id,
                'status': 'skipped',
                'reason': 'async_reports'
            }
        
        # 4. Объединяем площадки, убираем дубли
        all_platforms = {}
        for platforms in [platforms_today, platforms_yesterday, platforms_7d]:
            if platforms:
                for p in platforms:
                    domain = p['domain']
                    if domain not in all_platforms:
                        all_platforms[domain] = p
                    else:
                        merge_platform_metrics(all_platforms[domain], p)

        for platforms in goal_platform_sets:
            if platforms:
                for p in platforms:
                    domain = p['domain']
                    if domain not in all_platforms:
                        all_platforms[domain] = p
                    else:
                        merge_platform_metrics(all_platforms[domain], p, merge_base_metrics=False)
        
        candidates = list(all_platforms.values())
        
        if not candidates:
            return {
                'campaign_id': campaign_id,
                'status': 'success',
                'blocked': 0,
                'reason': 'no_candidates'
            }
        
        print(f"📊 Campaign {campaign_id}: {len(candidates)} candidates to check", flush=True)
        
        # 5. Получаем уже заблокированные площадки
        blocked_sites = get_blocked_sites(campaign_id, yandex_token)
        blocked_domains = set(s['domain'].lower() for s in blocked_sites)
        
        # 6. Фильтруем площадки по задачам
        matched_platforms = []
        for task in tasks:
            config = json.loads(task['config']) if isinstance(task['config'], str) else task['config']
            
            for platform in candidates:
                if platform['domain'].lower() in blocked_domains:
                    continue
                
                if matches_task_filters(platform, config, task.get('combine_operator') or 'AND'):
                    matched_platforms.append(platform)
                    print(f"✅ Platform {platform['domain']} matched task '{task['description']}'")
        
        # Убираем дубли
        to_block = list({p['domain']: p for p in matched_platforms}.values())
        
        if not to_block:
            print(f"ℹ️ Campaign {campaign_id}: no platforms matched task filters", flush=True)
            return {
                'campaign_id': campaign_id,
                'status': 'success',
                'blocked': 0,
                'reason': 'no_matches'
            }
        
        print(f"🎯 Campaign {campaign_id}: {len(to_block)} platforms matched filters")
        
        # 7. Ротация: если лимит 1000 превышен
        if len(blocked_sites) + len(to_block) > 1000:
            # Сортируем по вредоносности (расход DESC)
            all_sites = blocked_sites + to_block
            all_sites.sort(key=lambda x: x.get('cost', 0), reverse=True)
            
            # Берём топ-1000 самых дорогих
            top_1000 = all_sites[:1000]
            to_block = [s for s in top_1000 if s['domain'] not in blocked_domains]
            
            # Удаляем наименее вредные (если нужно)
            to_unblock = [s for s in blocked_sites if s not in top_1000]
            if to_unblock:
                unblock_sites(campaign_id, yandex_token, [s['domain'] for s in to_unblock])
                print(f"🔄 Campaign {campaign_id}: rotated {len(to_unblock)} platforms")
        
        # 8. Добавляем новые блокировки в Директе
        actually_blocked = 0
        if to_block:
            if block_sites(campaign_id, yandex_token, [p['domain'] for p in to_block]):
                actually_blocked = len(to_block)
                print(f"🚫 Campaign {campaign_id}: blocked {actually_blocked} platforms in Yandex", flush=True)
            else:
                print(f"❌ Campaign {campaign_id}: block_sites API failed, 0 blocked", flush=True)
                return {
                    'campaign_id': campaign_id,
                    'status': 'error',
                    'blocked': 0,
                    'error': 'ExcludedSites API failed'
                }
        
        return {
            'campaign_id': campaign_id,
            'status': 'success',
            'blocked': actually_blocked,
            'candidates': len(candidates)
        }
    finally:
        pass


def _normalize_list(value) -> List[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [item.strip().lower() for item in value.split(',') if item.strip()]
    return [str(item).strip().lower() for item in value if str(item).strip()]


def _normalize_goal_ids(config: Dict[str, Any]) -> List[str]:
    goal_ids = config.get('goal_ids')
    if goal_ids:
        return [str(goal_id).strip() for goal_id in goal_ids if str(goal_id).strip()][:10]

    goal_id = str(config.get('goal_id') or '').strip()
    if goal_id and goal_id not in ('all', 'selected'):
        return [goal_id]

    return []


def collect_selected_goal_ids(tasks) -> List[str]:
    selected = []
    for task in tasks:
        config = json.loads(task['config']) if isinstance(task['config'], str) else (task['config'] or {})
        for goal_id in _normalize_goal_ids(config):
            if goal_id not in selected:
                selected.append(goal_id)
            if len(selected) >= 10:
                return selected
    return selected


def _platform_conversions_for_config(platform: Dict[str, Any], config: Dict[str, Any]) -> int:
    goal_ids = _normalize_goal_ids(config)
    if not goal_ids:
        return int(platform.get('conversions', 0) or 0)

    goal_conversions = platform.get('goal_conversions') or {}
    if goal_conversions:
        return int(sum(goal_conversions.get(str(goal_id), 0) or 0 for goal_id in goal_ids))

    return int(platform.get('conversions', 0) or 0)


def _platform_cpa_for_config(platform: Dict[str, Any], config: Dict[str, Any]) -> float:
    conversions = _platform_conversions_for_config(platform, config)
    if conversions <= 0:
        return 0
    return float(platform.get('cost', 0) or 0) / conversions


def merge_platform_metrics(target: Dict[str, Any], source: Dict[str, Any], merge_base_metrics: bool = True) -> None:
    if merge_base_metrics:
        target['clicks'] += source.get('clicks', 0)
        target['cost'] += source.get('cost', 0)
        target['conversions'] += source.get('conversions', 0)
        target['impressions'] += source.get('impressions', 0)

    target_goals = target.setdefault('goal_conversions', {})
    for goal_id, value in (source.get('goal_conversions') or {}).items():
        target_goals[str(goal_id)] = target_goals.get(str(goal_id), 0) + (value or 0)

    if target.get('clicks', 0) > 0:
        target['cpc'] = target.get('cost', 0) / target['clicks']
    if target.get('impressions', 0) > 0:
        target['ctr'] = target.get('clicks', 0) / target['impressions'] * 100
    if target.get('conversions', 0) > 0:
        target['cpa'] = target.get('cost', 0) / target['conversions']


def _domain_matches_keyword(domain: str, keyword: str) -> bool:
    if '.' in keyword:
        return domain.startswith(keyword)
    return keyword in domain


def matches_task_filters(platform: Dict[str, Any], config: Dict[str, Any], combine_operator: str = 'AND') -> bool:
    '''
    Проверяет соответствие площадки фильтрам задачи.
    Исключения и защита конверсий всегда сильнее любых условий.
    AND: все активные условия должны совпасть.
    OR: достаточно любого активного условия.
    '''
    domain = platform['domain'].lower()
    combine_operator = (combine_operator or config.get('combine_operator') or 'AND').upper()
    
    exceptions = _normalize_list(config.get('exceptions', []))
    if exceptions and any(exc in domain for exc in exceptions):
        return False

    if config.get('protect_conversions') and _platform_conversions_for_config(platform, config) > 0:
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
        ('min_conversions', lambda value: _platform_conversions_for_config(platform, config) >= value),
        ('min_cpa', lambda value: _platform_cpa_for_config(platform, config) >= value),
        ('max_cpa', lambda value: _platform_cpa_for_config(platform, config) >= value),
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


def process_from_database() -> Dict[str, Any]:
    '''DB Fallback: обработка pending батчей из базы'''
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # ОЧИСТКА МЕРТВЫХ ЛОКОВ (старше 5 минут)
        cursor.execute("""
            DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_locks 
            WHERE expires_at < NOW()
        """)
        deleted_locks = cursor.rowcount
        conn.commit()
        if deleted_locks > 0:
            print(f'🔓 Cleaned {deleted_locks} expired campaign locks')
        
        # Получаем 1 pending batch
        cursor.execute("""
            SELECT b.id, b.project_id, b.campaign_ids, p.yandex_token
            FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches b
            JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = b.project_id
            WHERE b.status = 'pending'
            ORDER BY b.created_at ASC
            LIMIT 1
        """)
        
        batch = cursor.fetchone()
        
        if not batch:
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No pending batches',
                    'processed': 0
                })
            }
        
        # Обрабатываем батч рекурсивно через handler
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({
                'batch_id': batch['id'],
                'project_id': batch['project_id'],
                'campaign_ids': json.loads(batch['campaign_ids']) if isinstance(batch['campaign_ids'], str) else batch['campaign_ids'],
                'yandex_token': batch['yandex_token']
            })
        }
        
        class FakeContext:
            request_id = 'db-fallback'
        
        conn.close()
        return handler(event, FakeContext())
        
    except Exception as e:
        print(f'❌ DB Fallback error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def acquire_campaign_lock(campaign_id: str, request_id: str, cursor, conn, project_id: int) -> bool:
    '''Блокирует кампанию для обработки (избегаем race condition)'''
    try:
        cursor.execute("""
            INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_campaign_locks (campaign_id, locked_by, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '1 minute')
            ON CONFLICT (campaign_id) DO UPDATE
            SET locked_by = EXCLUDED.locked_by,
                locked_at = NOW(),
                expires_at = EXCLUDED.expires_at
            WHERE t_p97630513_yandex_cleaning_serv.rsya_campaign_locks.expires_at < NOW()
            RETURNING campaign_id
        """, (campaign_id, request_id))
        conn.commit()
        result = cursor.fetchone()
        return result is not None
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        return False


def release_campaign_lock(campaign_id: str, cursor, conn, project_id: int) -> None:
    '''Снимает блокировку кампании'''
    try:
        cursor.execute("""
            UPDATE t_p97630513_yandex_cleaning_serv.rsya_campaign_locks 
            SET expires_at = NOW() 
            WHERE campaign_id = %s
        """, (campaign_id,))
        conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass


def get_platforms_with_retry(
    campaign_id: str, 
    yandex_token: str, 
    days_ago: int,
    days_end: int,
    cursor,
    conn,
    project_id: int,
    task_id: int,
    goal_ids: Optional[List[str]] = None
) -> Optional[List[Dict[str, Any]]]:
    '''
    Получает площадки с clicks >= 1 за период с retry при 429
    Returns: list площадок или None (если async report)
    '''
    for attempt, delay in enumerate(RETRY_DELAYS):
        try:
            date_from = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
            date_to = (datetime.now() - timedelta(days=days_end)).strftime('%Y-%m-%d')
            
            # Запрашиваем отчёт у Яндекса
            response = create_report(campaign_id, yandex_token, date_from, date_to, goal_ids)
            
            if response['status'] == 200:
                # Отчёт готов → парсим TSV
                platforms = parse_tsv_report(response['data'])
                return platforms
            
            elif response['status'] in [201, 202]:
                # Отчёт готовится → сохраняем в pending (task_id и report_id NOT NULL в таблице)
                report_name = response.get('report_name', f"platforms_{campaign_id}_{date_from}")
                report_id = report_name
                cursor.execute("""
                    INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_pending_reports 
                    (project_id, task_id, report_id, campaign_ids, date_from, date_to, report_name, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                    ON CONFLICT (report_id) DO NOTHING
                """, (project_id, task_id, report_id, json.dumps([campaign_id]), date_from, date_to, report_name))
                conn.commit()
                print(f"⏳ Report {report_name} is pending (campaign {campaign_id})")
                return None
            
            elif response['status'] == 429:
                # 429 или 400 с кодом 56 (create_report возвращает 429) → retry с backoff
                if delay > MAX_WAIT_FOR_429:
                    print(f"⚠️ Rate/limit exceeded, skipping campaign {campaign_id}")
                    return None
                print(f"⏱️ Limit exceeded, waiting {delay}s... (attempt {attempt + 1}/{len(RETRY_DELAYS)})")
                time.sleep(delay)
                continue
            
            else:
                err = response.get('error', '')
                try:
                    err = err[:500] if isinstance(err, str) else json.dumps(err, ensure_ascii=False)[:500]
                except Exception:
                    err = str(err)[:500]
                print(f"❌ API error {response['status']}: {err}")
                return None
        
        except Exception as e:
            print(f"❌ Error getting platforms: {str(e)}")
            if attempt < len(RETRY_DELAYS) - 1:
                time.sleep(delay)
                continue
            return None
    
    return None


def create_report(campaign_id: str, yandex_token: str, date_from: str, date_to: str, goal_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    '''Создаёт отчёт через Yandex Direct API'''
    url = 'https://api.direct.yandex.com/json/v5/reports'
    headers = {
        'Authorization': f'Bearer {yandex_token}',
        'Accept-Language': 'ru',
        'processingMode': 'auto',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true'
    }
    
    normalized_goal_ids = [str(goal_id).strip() for goal_id in (goal_ids or []) if str(goal_id).strip()][:10]
    goal_suffix = ''
    if normalized_goal_ids:
        goal_suffix = '_g' + hashlib.sha1(','.join(normalized_goal_ids).encode('utf-8')).hexdigest()[:8]

    payload = {
        'params': {
            'SelectionCriteria': {
                'Filter': [
                    {
                        'Field': 'CampaignId',
                        'Operator': 'EQUALS',
                        'Values': [str(campaign_id)]
                    },
                    {
                        'Field': 'Impressions',
                        'Operator': 'GREATER_THAN',
                        'Values': ['0']
                    }
                ],
                'DateFrom': date_from,
                'DateTo': date_to
            },
            'FieldNames': ['Placement', 'Clicks', 'Cost', 'Conversions', 'Impressions'],
            'ReportName': f'platforms_{campaign_id}_{date_from}_{date_to}{goal_suffix}_{int(time.time())}',
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO'
        }
    }

    if normalized_goal_ids:
        payload['params']['Goals'] = normalized_goal_ids
        payload['params']['AttributionModels'] = ['AUTO']
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        time.sleep(API_DELAY)  # Задержка для соблюдения лимитов API
        
        if resp.status_code == 200:
            return {'status': 200, 'data': resp.text}
        elif resp.status_code in [201, 202]:
            return {'status': resp.status_code, 'report_name': payload['params']['ReportName']}
        elif resp.status_code == 429:
            return {'status': 429, 'error': 'Rate limit exceeded'}
        elif resp.status_code == 400:
            # 400 с кодом 56 = "Превышен лимит" (лимит отчётов) — обрабатываем как 429, retry с backoff
            try:
                err = resp.json()
                code = err.get('error', {}).get('error_code') or err.get('error', {}).get('error_code')
                if str(code) == '56':
                    return {'status': 429, 'error': err.get('error', {}).get('error_string') or 'Limit exceeded (56)'}
            except Exception:
                pass
            return {'status': 400, 'error': resp.text}
        else:
            return {'status': resp.status_code, 'error': resp.text}
    
    except requests.exceptions.Timeout:
        return {'status': 408, 'error': 'Request timeout'}
    except Exception as e:
        return {'status': 500, 'error': str(e)}


def parse_tsv_report(tsv_data: str) -> List[Dict[str, Any]]:
    '''Парсит TSV отчёт в список площадок'''
    lines = tsv_data.strip().split('\n')
    if len(lines) < 2:
        return []
    
    header = lines[0].split('\t')
    platforms = []
    for line in lines[1:]:
        parts = line.split('\t')
        if len(parts) < len(header):
            continue

        row = dict(zip(header, parts))
        domain = (row.get('Placement') or parts[0]).strip()
        if ' ' in domain or not domain:
            continue

        goal_conversions = {}
        for key, value in row.items():
            if not key.startswith('Conversions_'):
                continue
            parts_key = key.split('_')
            if len(parts_key) >= 3:
                goal_id = parts_key[1]
                goal_conversions[goal_id] = goal_conversions.get(goal_id, 0) + int(float(value or 0))

        conversions = int(float(row.get('Conversions') or 0))
        if goal_conversions:
            conversions = sum(goal_conversions.values())

        clicks = int(float(row.get('Clicks') or 0))
        cost = float(row.get('Cost') or 0)
        impressions = int(float(row.get('Impressions') or 0))
        cpc = cost / clicks if clicks else 0
        ctr = (clicks / impressions * 100) if impressions else 0
        cpa = cost / conversions if conversions else 0
        platforms.append({
            'domain': domain,
            'clicks': clicks,
            'cost': cost,
            'conversions': conversions,
            'goal_conversions': goal_conversions,
            'impressions': impressions,
            'cpc': cpc,
            'cpa': cpa,
            'ctr': ctr
        })
    
    return platforms


def get_blocked_sites(campaign_id: str, yandex_token: str) -> List[Dict[str, Any]]:
    '''Получает уже заблокированные площадки именно из Campaign.ExcludedSites.'''
    excluded_sites = get_excluded_sites(yandex_token, campaign_id)
    if excluded_sites is None or excluded_sites == 'UNMODIFIABLE':
        return []
    return [{'domain': site, 'cost': 0} for site in excluded_sites]


def block_sites(campaign_id: str, yandex_token: str, domains: List[str]) -> bool:
    '''Блокирует площадки через Yandex Direct API'''
    
    # Получаем текущий список ExcludedSites
    current_excluded = get_excluded_sites(yandex_token, campaign_id)
    
    if current_excluded == 'UNMODIFIABLE':
        print(f'⚠️ Campaign {campaign_id} cannot be modified, skipping ExcludedSites update')
        return False

    if current_excluded is None:
        print(f'❌ Failed to fetch ExcludedSites for campaign {campaign_id}')
        return False
    
    # Приводим все домены к lowercase (Яндекс чувствителен к регистру)
    current_excluded_normalized = [d.lower() for d in current_excluded]
    domains_normalized = [d.lower() for d in domains]
    
    # Фильтруем домены которых еще нет в списке
    current_excluded_set = set(current_excluded_normalized)
    domains_to_add = [d for d in domains_normalized if d not in current_excluded_set]
    
    if not domains_to_add:
        print(f'✅ All {len(domains)} domains already blocked in campaign {campaign_id}')
        return True
    
    # Добавляем новые домены (используем set для уникальности)
    new_excluded_list = list(set(current_excluded_normalized + domains_to_add))
    
    print(f'📝 Campaign {campaign_id}: Adding {len(domains_to_add)} domains (current: {len(current_excluded)}, new total: {len(new_excluded_list)})')
    
    # Обновляем в Яндексе
    success = update_excluded_sites(yandex_token, campaign_id, new_excluded_list)
    
    if success:
        print(f'✅ Blocked {len(domains_to_add)} domains in campaign {campaign_id}')
    else:
        print(f'❌ Failed to block domains in campaign {campaign_id}')
    
    return success


def unblock_sites(campaign_id: str, yandex_token: str, domains: List[str]) -> bool:
    '''Разблокирует площадки (ротация)'''
    
    # Получаем текущий список ExcludedSites
    current_excluded = get_excluded_sites(yandex_token, campaign_id)
    
    if current_excluded is None:
        print(f'❌ Failed to fetch ExcludedSites for campaign {campaign_id}')
        return False
    
    # Убираем указанные домены
    current_excluded_set = set(current_excluded)
    domains_to_remove = set(domains)
    new_excluded_list = list(current_excluded_set - domains_to_remove)
    
    print(f'📝 Campaign {campaign_id}: Removing {len(domains_to_remove)} domains (current: {len(current_excluded)}, new total: {len(new_excluded_list)})')
    
    # Обновляем в Яндексе
    success = update_excluded_sites(yandex_token, campaign_id, new_excluded_list)
    
    if success:
        print(f'✅ Unblocked {len(domains_to_remove)} domains in campaign {campaign_id}')
    else:
        print(f'❌ Failed to unblock domains in campaign {campaign_id}')
    
    return success


def get_excluded_sites(token: str, campaign_id: str) -> Optional[List[str]]:
    '''Получение списка ExcludedSites из Яндекс.Директ'''
    
    try:
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'get',
                'params': {
                    'SelectionCriteria': {
                        'Ids': [int(campaign_id)]
                    },
                    'FieldNames': ['Id', 'ExcludedSites', 'Status']
                }
            },
            headers={
                'Authorization': f'Bearer {token}',
                'Accept-Language': 'ru'
            },
            timeout=30
        )
        time.sleep(API_DELAY)  # Задержка для соблюдения лимитов API
        
        if response.status_code != 200:
            print(f'❌ Yandex API error: {response.status_code}, {response.text[:500]}')
            return None
        
        data = response.json()
        campaigns = data.get('result', {}).get('Campaigns', [])
        
        if not campaigns:
            print(f'📭 Campaign {campaign_id}: API returned empty campaigns list')
            return []
        
        # КРИТИЧЕСКАЯ ПРОВЕРКА: API вернул именно запрошенную кампанию
        campaign_data = campaigns[0]
        returned_id = campaign_data.get('Id')
        print(f'📋 API returned campaign ID: {returned_id} (requested: {campaign_id})')
        
        if str(returned_id) != str(campaign_id):
            print(f'🚨 CRITICAL: API returned WRONG campaign! Requested {campaign_id}, got {returned_id}')
            print(f'🛡️ SAFETY: Aborting to prevent overwriting wrong campaign data!')
            return None

        campaign_status = campaign_data.get('Status', 'UNKNOWN')
        if campaign_status != 'ACCEPTED':
            print(f'⚠️ Campaign {campaign_id} has status {campaign_status}, cannot be modified')
            return 'UNMODIFIABLE'
        
        excluded_sites_obj = campaign_data.get('ExcludedSites', {})
        excluded = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
        
        print(f'📊 Campaign {campaign_id}: ExcludedSites contains {len(excluded)} domains')
        if excluded:
            print(f'   First 5: {excluded[:5]}')
            print(f'   Last 5: {excluded[-5:]}')
        
        # Дедуплицируем список (избегаем ошибки 9802)
        deduplicated = list(dict.fromkeys(excluded)) if excluded else []
        
        if len(excluded) != len(deduplicated):
            print(f'⚠️ Removed {len(excluded) - len(deduplicated)} duplicates from ExcludedSites')
        
        return deduplicated
        
    except Exception as e:
        print(f'❌ Error fetching ExcludedSites: {str(e)}')
        return None


def update_excluded_sites(token: str, campaign_id: str, excluded_sites: List[str]) -> bool:
    '''Обновление списка ExcludedSites в Яндекс.Директ'''
    
    try:
        # Валидация доменов перед отправкой
        valid_sites = []
        invalid_sites = []
        
        for site in excluded_sites:
            # Пропускаем пустые строки
            if not site or not site.strip():
                invalid_sites.append((site, 'empty'))
                continue
            
            site_clean = site.strip()
            
            # Проверяем длину (макс 255 символов)
            if len(site_clean) > 255:
                invalid_sites.append((site_clean, 'too_long'))
                continue
            
            # Проверяем на пробелы, табы, переносы строк
            if any(char in site_clean for char in [' ', '\t', '\n', '\r']):
                invalid_sites.append((site_clean, 'whitespace'))
                continue
            
            # Проверяем что не начинается с точки или дефиса
            if site_clean.startswith('.') or site_clean.startswith('-'):
                invalid_sites.append((site_clean, 'invalid_start'))
                continue
            
            # Проверяем что не заканчивается точкой или дефисом
            if site_clean.endswith('.') or site_clean.endswith('-'):
                invalid_sites.append((site_clean, 'invalid_end'))
                continue
            
            # Проверяем на кириллицу (русские буквы)
            if any(ord(char) >= 0x0400 and ord(char) <= 0x04FF for char in site_clean):
                invalid_sites.append((site_clean, 'contains_cyrillic'))
                continue
            
            # Проверяем на запрещенные символы (только буквы, цифры, точка, дефис)
            if not all(char.isalnum() or char in ['.', '-'] for char in site_clean):
                invalid_sites.append((site_clean, 'invalid_chars'))
                continue
            
            # Проверяем что нет двойных точек подряд
            if '..' in site_clean:
                invalid_sites.append((site_clean, 'double_dot'))
                continue
            
            valid_sites.append(site_clean)
        
        # Логируем невалидные домены
        if invalid_sites:
            print(f'⚠️ FILTERED {len(invalid_sites)} invalid domains:')
            for site, reason in invalid_sites[:10]:  # Показываем первые 10
                print(f'  ❌ {site[:50]} → {reason}')
            if len(invalid_sites) > 10:
                print(f'  ... и еще {len(invalid_sites) - 10} доменов')
        
        if not valid_sites:
            print(f'❌ No valid domains to update')
            return False
        
        print(f'🔄 Updating campaign {campaign_id}: {len(valid_sites)} valid domains (filtered {len(invalid_sites)})')
        
        # ЛОГИРУЕМ ВСЕ ДОМЕНЫ для отладки ошибки 5006
        print(f'📋 ALL {len(valid_sites)} DOMAINS TO SEND:')
        for i, domain in enumerate(valid_sites):
            print(f'  [{i}] {domain}')
            if i >= 600:  # Лимит на вывод
                print(f'  ... and {len(valid_sites) - 600} more')
                break
        
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'update',
                'params': {
                    'Campaigns': [{
                        'Id': int(campaign_id),
                        'ExcludedSites': {
                            'Items': valid_sites
                        }
                    }]
                }
            },
            headers={
                'Authorization': f'Bearer {token}',
                'Accept-Language': 'ru'
            },
            timeout=30
        )
        time.sleep(API_DELAY)  # Задержка для соблюдения лимитов API
        
        print(f'📡 HTTP Status: {response.status_code}')
        
        if response.status_code != 200:
            print(f'❌ FULL API ERROR: {response.text}')
            return False
        
        data = response.json()
        print(f'📥 FULL API RESPONSE: {json.dumps(data, ensure_ascii=False)}')
        
        # Проверяем что обновление прошло успешно
        if 'result' in data:
            update_results = data['result'].get('UpdateResults', [])
            if update_results and 'Id' in update_results[0]:
                print(f'✅ Campaign {campaign_id} updated successfully')
                return True
        
        # Если есть ошибки
        if 'error' in data:
            print(f'❌ API ERROR OBJECT: {json.dumps(data["error"], ensure_ascii=False)}')
        else:
            print(f'❌ NO RESULT, NO ERROR - unexpected response format')
        
        return False
        
    except Exception as e:
        print(f'❌ Exception in update_excluded_sites: {str(e)}')
        import traceback
        print(f'❌ Traceback: {traceback.format_exc()}')
        return False
