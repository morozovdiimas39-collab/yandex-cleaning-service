import json
import os
import time
import io
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import requests

# Retry настройки
RETRY_DELAYS = [5, 10, 20, 40, 60]  # Exponential backoff
MAX_WAIT_FOR_429 = 60  # Максимум ждём 60 сек при 429

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Worker для обработки батча кампаний (чистка площадок РСЯ)
    Args: event - dict с batch_id, project_id, campaign_ids, yandex_token
          context - объект с request_id
    Returns: HTTP response с результатами обработки
    '''
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
        # Прямой вызов (для тестов)
        body_str = event.get('body', '{}')
        if not body_str or body_str == '{}':
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Empty body. Expected batch_id, project_id, campaign_ids, yandex_token'})
            }
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
        
        # Обновляем статус батча
        cursor.execute("""
            UPDATE rsya_campaign_batches
            SET status = 'processing', started_at = NOW()
            WHERE id = %s
        """, (batch_id,))
        conn.commit()
        
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
                results.append({
                    'campaign_id': campaign_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Подсчитываем статистику
        successful = sum(1 for r in results if r.get('status') == 'success')
        failed = sum(1 for r in results if r.get('status') == 'error')
        skipped = sum(1 for r in results if r.get('status') == 'skipped')
        
        processing_time = int(time.time() - start_time)
        
        # Обновляем статус батча
        cursor.execute("""
            UPDATE rsya_campaign_batches
            SET status = 'completed',
                completed_at = NOW(),
                processing_time_sec = %s
            WHERE id = %s
        """, (processing_time, batch_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Batch {batch_id}: {successful} success, {failed} failed, {skipped} skipped ({processing_time}s)")
        
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
        
        # Пытаемся обновить статус батча в БД
        try:
            cursor.execute("""
                UPDATE rsya_campaign_batches
                SET status = 'failed',
                    error_message = %s,
                    retry_count = retry_count + 1
                WHERE id = %s
            """, (str(e), batch_id))
            conn.commit()
        except:
            pass
        
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
    Обработка одной кампании: получение площадок, фильтрация, блокировка
    '''
    
    # 1. Блокировка кампании (избегаем race condition)
    lock_acquired = acquire_campaign_lock(campaign_id, context.request_id, cursor, conn)
    if not lock_acquired:
        print(f"⚠️ Campaign {campaign_id} is locked by another worker, skipping")
        return {
            'campaign_id': campaign_id,
            'status': 'skipped',
            'reason': 'locked'
        }
    
    try:
        # 2. Получаем площадки за 3 периода (сегодня, вчера, 7 дней)
        platforms_today = get_platforms_with_retry(campaign_id, yandex_token, 0, 0, cursor, conn, project_id)
        platforms_yesterday = get_platforms_with_retry(campaign_id, yandex_token, 1, 1, cursor, conn, project_id)
        platforms_7d = get_platforms_with_retry(campaign_id, yandex_token, 7, 0, cursor, conn, project_id)
        
        # Если все отчёты async (201/202) → пропускаем (обработает поллер)
        if platforms_today is None and platforms_yesterday is None and platforms_7d is None:
            return {
                'campaign_id': campaign_id,
                'status': 'skipped',
                'reason': 'async_reports'
            }
        
        # 3. Объединяем площадки, убираем дубли
        all_platforms = {}
        for platforms in [platforms_today, platforms_yesterday, platforms_7d]:
            if platforms:
                for p in platforms:
                    domain = p['domain']
                    if domain not in all_platforms:
                        all_platforms[domain] = p
                    else:
                        # Суммируем метрики
                        all_platforms[domain]['clicks'] += p.get('clicks', 0)
                        all_platforms[domain]['cost'] += p.get('cost', 0)
                        all_platforms[domain]['conversions'] += p.get('conversions', 0)
        
        candidates = list(all_platforms.values())
        
        if not candidates:
            return {
                'campaign_id': campaign_id,
                'status': 'success',
                'blocked': 0,
                'reason': 'no_candidates'
            }
        
        # 4. Получаем уже заблокированные площадки
        blocked_sites = get_blocked_sites(campaign_id, yandex_token)
        blocked_domains = set(s['domain'] for s in blocked_sites)
        
        # 5. Убираем уже заблокированные
        to_block = [p for p in candidates if p['domain'] not in blocked_domains]
        
        if not to_block:
            return {
                'campaign_id': campaign_id,
                'status': 'success',
                'blocked': 0,
                'reason': 'already_blocked'
            }
        
        # 6. Ротация: если лимит 1000 превышен
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
        
        # 7. Добавляем новые блокировки
        if to_block:
            block_sites(campaign_id, yandex_token, [p['domain'] for p in to_block])
            print(f"🚫 Campaign {campaign_id}: blocked {len(to_block)} platforms")
        
        return {
            'campaign_id': campaign_id,
            'status': 'success',
            'blocked': len(to_block),
            'candidates': len(candidates)
        }
        
    finally:
        # Снимаем блокировку кампании
        release_campaign_lock(campaign_id, cursor, conn)


def acquire_campaign_lock(campaign_id: str, request_id: str, cursor, conn) -> bool:
    '''Блокирует кампанию для обработки (избегаем race condition)'''
    try:
        cursor.execute("""
            INSERT INTO rsya_campaign_locks (campaign_id, locked_by, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '5 minutes')
            ON CONFLICT (campaign_id) DO UPDATE
            SET locked_by = EXCLUDED.locked_by,
                locked_at = NOW(),
                expires_at = EXCLUDED.expires_at
            WHERE rsya_campaign_locks.expires_at < NOW()
            RETURNING campaign_id
        """, (campaign_id, request_id))
        conn.commit()
        result = cursor.fetchone()
        return result is not None
    except:
        return False


def release_campaign_lock(campaign_id: str, cursor, conn) -> None:
    '''Снимает блокировку кампании'''
    try:
        cursor.execute("""
            UPDATE rsya_campaign_locks 
            SET expires_at = NOW() 
            WHERE campaign_id = %s
        """, (campaign_id,))
        conn.commit()
    except:
        pass


def get_platforms_with_retry(
    campaign_id: str, 
    yandex_token: str, 
    days_ago: int,
    days_end: int,
    cursor,
    conn,
    project_id: int
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
            response = create_report(campaign_id, yandex_token, date_from, date_to)
            
            if response['status'] == 200:
                # Отчёт готов → парсим TSV
                platforms = parse_tsv_report(response['data'])
                return platforms
            
            elif response['status'] in [201, 202]:
                # Отчёт готовится → сохраняем в pending
                report_name = response.get('report_name', f"report_{campaign_id}_{date_from}")
                cursor.execute("""
                    INSERT INTO rsya_pending_reports 
                    (project_id, campaign_ids, date_from, date_to, report_name, status)
                    VALUES (%s, %s, %s, %s, %s, 'pending')
                    ON CONFLICT DO NOTHING
                """, (project_id, json.dumps([campaign_id]), date_from, date_to, report_name))
                conn.commit()
                print(f"⏳ Report {report_name} is pending (campaign {campaign_id})")
                return None
            
            elif response['status'] == 429:
                # Rate limit → retry с backoff
                if delay > MAX_WAIT_FOR_429:
                    print(f"⚠️ Rate limit exceeded, skipping campaign {campaign_id}")
                    return None
                print(f"⏱️ Rate limit, waiting {delay}s... (attempt {attempt + 1}/{len(RETRY_DELAYS)})")
                time.sleep(delay)
                continue
            
            else:
                # Другая ошибка
                print(f"❌ API error {response['status']}: {response.get('error')}")
                return None
        
        except Exception as e:
            print(f"❌ Error getting platforms: {str(e)}")
            if attempt < len(RETRY_DELAYS) - 1:
                time.sleep(delay)
                continue
            return None
    
    return None


def create_report(campaign_id: str, yandex_token: str, date_from: str, date_to: str) -> Dict[str, Any]:
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
                        'Field': 'Clicks',
                        'Operator': 'GREATER_THAN',
                        'Values': ['0']
                    }
                ],
                'DateFrom': date_from,
                'DateTo': date_to
            },
            'FieldNames': ['Placement', 'Clicks', 'Cost', 'Conversions'],
            'ReportName': f'platforms_{campaign_id}_{date_from}',
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO'
        }
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if resp.status_code == 200:
            return {'status': 200, 'data': resp.text}
        elif resp.status_code in [201, 202]:
            return {'status': resp.status_code, 'report_name': payload['params']['ReportName']}
        elif resp.status_code == 429:
            return {'status': 429, 'error': 'Rate limit exceeded'}
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
    
    platforms = []
    for line in lines[1:]:  # Пропускаем заголовок
        parts = line.split('\t')
        if len(parts) >= 4:
            platforms.append({
                'domain': parts[0],
                'clicks': int(parts[1] or 0),
                'cost': float(parts[2] or 0),
                'conversions': int(parts[3] or 0)
            })
    
    return platforms


def get_blocked_sites(campaign_id: str, yandex_token: str) -> List[Dict[str, Any]]:
    '''Получает список заблокированных площадок кампании'''
    url = 'https://api.direct.yandex.com/json/v5/negativekeywordsharedsets'
    headers = {
        'Authorization': f'Bearer {yandex_token}',
        'Accept-Language': 'ru'
    }
    
    payload = {
        'method': 'get',
        'params': {
            'SelectionCriteria': {},
            'FieldNames': ['Id', 'Name', 'NegativeKeywords']
        }
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            result = data.get('result', {}).get('NegativeKeywordSharedSets', [])
            
            blocked = []
            for item in result:
                for keyword in item.get('NegativeKeywords', []):
                    blocked.append({'domain': keyword, 'cost': 0})
            
            return blocked
        
        return []
    
    except Exception as e:
        print(f"❌ Error getting blocked sites: {str(e)}")
        return []


def block_sites(campaign_id: str, yandex_token: str, domains: List[str]) -> bool:
    '''Блокирует площадки через Yandex Direct API'''
    
    # Получаем текущий список ExcludedSites
    current_excluded = get_excluded_sites(yandex_token, campaign_id)
    
    if current_excluded is None:
        print(f'❌ Failed to fetch ExcludedSites for campaign {campaign_id}')
        return False
    
    # Фильтруем домены которых еще нет в списке
    current_excluded_set = set(current_excluded)
    domains_to_add = [d for d in domains if d not in current_excluded_set]
    
    if not domains_to_add:
        print(f'✅ All {len(domains)} domains already blocked in campaign {campaign_id}')
        return True
    
    # Добавляем новые домены (используем set для уникальности)
    new_excluded_list = list(set(list(current_excluded_set) + domains_to_add))
    
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
                    'FieldNames': ['Id', 'ExcludedSites']
                }
            },
            headers={
                'Authorization': f'Bearer {token}',
                'Accept-Language': 'ru'
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f'❌ Yandex API error: {response.status_code}, {response.text[:500]}')
            return None
        
        data = response.json()
        campaigns = data.get('result', {}).get('Campaigns', [])
        
        if not campaigns:
            return []
        
        excluded_sites_obj = campaigns[0].get('ExcludedSites', {})
        excluded = excluded_sites_obj.get('Items', []) if excluded_sites_obj else []
        
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
        print(f'🔄 Updating campaign {campaign_id}: {len(excluded_sites)} domains')
        
        response = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'update',
                'params': {
                    'Campaigns': [{
                        'Id': int(campaign_id),
                        'ExcludedSites': {
                            'Items': excluded_sites
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