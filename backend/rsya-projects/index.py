import json
import os
from typing import Dict, Any, List
import psycopg2
import psycopg2.extras


def _normalize_list(value) -> List[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(',') if item.strip()]
    return [str(item).strip() for item in value if str(item).strip()]


def validate_rsya_task_config(config: Dict[str, Any], combine_operator: str) -> List[str]:
    """Возвращает причины, почему задачу опасно создавать."""
    config = config or {}
    combine_operator = (combine_operator or 'OR').upper()

    keywords = _normalize_list(config.get('keywords'))
    exceptions = _normalize_list(config.get('exceptions'))
    goal_ids = _normalize_list(config.get('goal_ids'))
    goal_id = str(config.get('goal_id') or '').strip()
    has_selected_goal = bool(goal_ids) or (goal_id and goal_id not in ('all', 'selected'))
    has_conversion_guard = has_selected_goal or bool(config.get('protect_conversions'))

    metric_keys = [
        'min_impressions', 'max_impressions',
        'min_clicks', 'max_clicks',
        'min_cpc', 'max_cpc',
        'min_ctr', 'max_ctr',
        'min_conversions', 'min_cpa', 'max_cpa'
    ]
    active_metrics = [key for key in metric_keys if config.get(key) is not None]
    reasons = []

    if not keywords and not active_metrics:
        reasons.append('Добавьте хотя бы одно условие блокировки: домены, клики, CPA, CTR или конверсии.')

    only_broad_metric = len(active_metrics) == 1 and active_metrics[0] in ('min_impressions', 'max_impressions', 'min_clicks', 'max_clicks')
    if only_broad_metric and not keywords and not has_conversion_guard:
        reasons.append('Одна широкая метрика без целей и доменных условий опасна: такая задача может заблокировать слишком много площадок.')

    min_impressions = config.get('min_impressions')
    if min_impressions is not None and int(min_impressions) <= 10 and not keywords and not has_conversion_guard:
        reasons.append('Показы больше 1-10 без дополнительных условий запрещены. Добавьте цель, CPA/клики или доменные признаки.')

    if combine_operator == 'OR' and active_metrics and not keywords and not exceptions and not has_conversion_guard:
        reasons.append('Для режима "Любое условие" нужны ограничители: цель, исключения или доменные признаки.')

    return reasons[:3]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: CRUD операции с проектами РСЯ чистки
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    headers_raw = event.get('headers', {})
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Получаем user_id из заголовка
    user_id = headers_raw.get('X-User-Id') or headers_raw.get('x-user-id')
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-User-Id header required'})
        }
    
    try:
        user_id_int = int(user_id)
    except:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid user_id'})
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
        conn.autocommit = True
        cursor = conn.cursor()
        
        # GET /projects?action=get_task_history - получить историю задач
        if method == 'GET' and query_params.get('action') == 'get_task_history':
            project_id = int(query_params.get('project_id', 0))
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Получаем историю выполнения задач
            cursor.execute("""
                SELECT th.id, th.task_id, t.description, th.executed_at, 
                       th.placements_checked, th.placements_blocked, th.status, th.error_message
                FROM t_p97630513_yandex_cleaning_serv.task_history th
                JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = th.task_id
                WHERE t.project_id = %s
                ORDER BY th.executed_at DESC
                LIMIT 100
            """, (project_id,))
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    'id': row[0],
                    'task_id': row[1],
                    'task_description': row[2],
                    'executed_at': row[3].isoformat() if row[3] else None,
                    'placements_checked': row[4],
                    'placements_blocked': row[5],
                    'status': row[6],
                    'error_message': row[7]
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'history': history})
            }
        
        # GET /projects - список проектов пользователя
        if method == 'GET' and not query_params.get('project_id'):
            cursor.execute(
                "SELECT id, name, created_at, updated_at, (yandex_token IS NOT NULL) as has_token FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE user_id = %s ORDER BY created_at DESC",
                (user_id_int,)
            )
            rows = cursor.fetchall()
            
            projects = []
            for row in rows:
                projects.append({
                    'id': row[0],
                    'name': row[1],
                    'created_at': row[2].isoformat() if row[2] else None,
                    'updated_at': row[3].isoformat() if row[3] else None,
                    'has_token': row[4]
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'projects': projects})
            }
        
        # GET /projects?project_id=X - получить проект с токеном
        if method == 'GET' and query_params.get('project_id'):
            project_id = int(query_params['project_id'])
            
            print(f'[DEBUG] GET project {project_id} for user {user_id_int}')
            
            cursor.execute(
                "SELECT id, name, yandex_token, created_at, updated_at, is_configured, client_login, campaign_ids, counter_ids, auto_add_campaigns FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            row = cursor.fetchone()
            
            print(f'[DEBUG] Query result: {row}')
            
            if not row:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            campaign_ids = []
            if row[7]:
                try:
                    campaign_ids = json.loads(row[7])
                except:
                    pass
            
            counter_ids = []
            if row[8]:
                try:
                    counter_ids = json.loads(row[8])
                except:
                    pass
            
            # Загружаем цели из rsya_goals
            cursor.execute(
                "SELECT goal_id, goal_name, counter_id, counter_name FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s AND is_enabled = true",
                (project_id,)
            )
            goals_rows = cursor.fetchall()
            goals = [{
                'id': g[0], 
                'name': g[1],
                'counter_id': g[2],
                'counter_name': g[3]
            } for g in goals_rows]
            
            # НЕ загружаем закэшированные площадки (их слишком много для ответа!)
            # Фронтенд загрузит их через yandex-platform-stats
            cached_platforms = []
            
            # Загружаем задачи из rsya_tasks
            cursor.execute(
                "SELECT id, description, enabled, config, created_at, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks_rows = cursor.fetchall()
            tasks = []
            for t in tasks_rows:
                task = {
                    'id': t[0],
                    'description': t[1],
                    'is_enabled': t[2] or False,
                    'created_at': t[4].isoformat() if t[4] else None,
                    'combine_operator': t[5] if t[5] else 'OR'
                }
                if t[3]:
                    try:
                        task['config'] = json.loads(t[3]) if isinstance(t[3], str) else t[3]
                    except:
                        task['config'] = None
                tasks.append(task)
            
            project = {
                'id': row[0],
                'name': row[1],
                'yandex_token': row[2],
                'created_at': row[3].isoformat() if row[3] else None,
                'updated_at': row[4].isoformat() if row[4] else None,
                'is_configured': row[5] or False,
                'client_login': row[6],
                'campaign_ids': campaign_ids,
                'counter_ids': counter_ids,
                'auto_add_campaigns': row[9] if row[9] is not None else True,
                'goals': goals,
                'cached_platforms': cached_platforms,
                'tasks': tasks
            }
            
            print(f'[DEBUG] GET project {project_id}: is_configured={row[5]}, has_token={row[2] is not None}')
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'project': project})
            }
        
        # Парсим body для всех POST запросов
        if method == 'POST':
            body_str = event.get('body', '{}')
            body_data = json.loads(body_str)
        
        # POST /projects?action=save_platforms - сохранение площадок
        if method == 'POST' and query_params.get('action') == 'save_platforms':
            
            project_id = int(query_params.get('project_id', 0))
            platforms = body_data.get('platforms', [])
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            cursor.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats WHERE project_id = %s", (project_id,))
            
            values = []
            for platform in platforms:
                for campaign in platform.get('campaigns', []):
                    is_blocked = platform.get('blocked', False)
                    status = 'blocked' if is_blocked else 'active'
                    values.append((
                        project_id,
                        campaign['id'],
                        campaign['name'],
                        platform['url'],
                        platform.get('impressions', 0),
                        platform.get('clicks', 0),
                        platform.get('cost', 0),
                        platform.get('conversions', 0),
                        platform.get('ctr', 0),
                        platform.get('cpc', 0),
                        platform.get('cpa', 0),
                        is_blocked,
                        status
                    ))
            
            if values:
                psycopg2.extras.execute_batch(
                    cursor,
                    "INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_platform_stats (project_id, campaign_id, campaign_name, url, impressions, clicks, cost, conversions, ctr, cpc, cpa, is_blocked, status, date_from, date_to) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE - 30, CURRENT_DATE)",
                    values,
                    page_size=1000
                )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'platforms_saved': len(values)})
            }
        
        # POST /projects?action=load_platforms - загрузка площадок из БД
        if method == 'POST' and query_params.get('action') == 'load_platforms':
            project_id = body_data.get('project_id')
            campaign_ids = body_data.get('campaign_ids', [])
            date_from = body_data.get('date_from')
            date_to = body_data.get('date_to')
            goal_id = body_data.get('goal_id', '')
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Формируем SQL запрос
            campaign_ids_str = ','.join([f"'{cid}'" for cid in campaign_ids]) if campaign_ids else "''"
            
            query = f"""
                SELECT campaign_id, campaign_name, url, impressions, clicks, cost, 
                       conversions, ctr, cpc, cpa, is_blocked, 
                       COALESCE(status, CASE WHEN is_blocked THEN 'blocked' ELSE 'active' END) as status
                FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats
                WHERE project_id = {project_id}
                  AND is_blocked = false
            """
            
            if campaign_ids:
                query += f" AND campaign_id IN ({campaign_ids_str})"
            if date_from:
                query += f" AND date_from = '{date_from}'"
            if date_to:
                query += f" AND date_to = '{date_to}'"
            if goal_id:
                query += f" AND COALESCE(goal_id, '') = '{goal_id}'"
            
            query += " ORDER BY clicks DESC LIMIT 1000"
            
            print(f'[DEBUG] load_platforms query for project {project_id}')
            print(f'[DEBUG] Filters: campaigns={len(campaign_ids)}, from={date_from}, to={date_to}, goal={goal_id}')
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            print(f'[DEBUG] Found {len(rows)} active platforms')
            
            # Конвертируем в JSON-совместимый формат
            platforms = []
            for row in rows:
                platforms.append({
                    'campaign_id': row[0],
                    'campaign_name': row[1],
                    'url': row[2],
                    'impressions': float(row[3]) if row[3] else 0,
                    'clicks': float(row[4]) if row[4] else 0,
                    'cost': float(row[5]) if row[5] else 0,
                    'conversions': float(row[6]) if row[6] else 0,
                    'ctr': float(row[7]) if row[7] else 0,
                    'cpc': float(row[8]) if row[8] else 0,
                    'cpa': float(row[9]) if row[9] else 0,
                    'is_blocked': row[10],
                    'status': row[11]
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'platforms': platforms, 'count': len(platforms)})
            }
        
        # POST /projects?action=sync-goals - синхронизация целей
        if method == 'POST' and query_params.get('action') == 'sync-goals':
            project_id = body_data.get('project_id')
            goals = body_data.get('goals', [])
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Удаляем старые цели
            cursor.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s", (project_id,))
            
            # Добавляем новые цели
            for goal in goals:
                cursor.execute(
                    "INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_goals (project_id, goal_id, goal_name, counter_id, counter_name, is_enabled) VALUES (%s, %s, %s, %s, %s, true)",
                    (project_id, goal['id'], goal['name'], goal.get('counter_id'), goal.get('counter_name'))
                )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'goals_synced': len(goals)})
            }
        
        # POST /projects?action=add_task - добавить задачу
        if method == 'POST' and body_data.get('action') == 'add_task':
            project_id = body_data.get('project_id')
            description = body_data.get('description', 'Новая задача')
            config = body_data.get('config')
            combine_operator = body_data.get('combine_operator', 'OR')
            validation_errors = validate_rsya_task_config(config or {}, combine_operator)
            if validation_errors:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'unsafe_task_config',
                        'message': 'Задача выглядит опасной и не будет создана.',
                        'reasons': validation_errors
                    }, ensure_ascii=False)
                }
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Создаём задачу с config и combine_operator
            cursor.execute(
                "INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_tasks (project_id, description, enabled, config, combine_operator) VALUES (%s, %s, true, %s, %s) RETURNING id",
                (project_id, description, json.dumps(config) if config else '{}', combine_operator)
            )
            task_id = cursor.fetchone()[0]
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks = []
            for row in cursor.fetchall():
                config = None
                if row[3]:
                    try:
                        config = json.loads(row[3]) if isinstance(row[3], str) else row[3]
                    except:
                        pass
                tasks.append({
                    'id': row[0],
                    'description': row[1],
                    'is_enabled': row[2],
                    'config': config,
                    'created_at': row[4].isoformat() if row[4] else None,
                    'combine_operator': row[5] if row[5] else 'OR'
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'task_id': task_id, 'tasks': tasks})
            }
        
        # POST /projects?action=delete_task - удалить задачу
        if method == 'POST' and body_data.get('action') == 'delete_task':
            project_id = body_data.get('project_id')
            task_id = body_data.get('task_id')
            
            if not project_id or not task_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id and task_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # 1. Удаляем записи из block_queue для этой задачи
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE task_id = %s",
                (task_id,)
            )
            deleted_queue = cursor.rowcount
            print(f'🗑️  Deleted {deleted_queue} items from block_queue for task {task_id}')
            
            # 2. Удаляем логи выполнения задачи
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE task_id = %s",
                (task_id,)
            )
            deleted_logs = cursor.rowcount
            print(f'🗑️  Deleted {deleted_logs} execution logs for task {task_id}')
            
            # 3. Удаляем pending батчи для этого проекта
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches WHERE project_id = %s AND status IN ('pending', 'processing')",
                (project_id,)
            )
            print(f'🗑️  Deleted pending batches for project {project_id}')
            
            # 4. Удаляем блокировки кампаний (если таблица доступна)
            try:
                cursor.execute(
                    "DELETE FROM rsya_campaign_locks WHERE project_id = %s",
                    (project_id,)
                )
                print(f'🔓 Deleted campaign locks for project {project_id}')
            except Exception as lock_error:
                print(f'⚠️  Could not delete campaign locks: {str(lock_error)}')
            
            # 5. Удаляем саму задачу
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE id = %s AND project_id = %s",
                (task_id, project_id)
            )
            print(f'✅ Deleted task {task_id}')
            
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks = []
            for row in cursor.fetchall():
                config = None
                if row[3]:
                    try:
                        config = json.loads(row[3]) if isinstance(row[3], str) else row[3]
                    except:
                        pass
                tasks.append({
                    'id': row[0],
                    'description': row[1],
                    'is_enabled': row[2],
                    'config': config,
                    'created_at': row[4].isoformat() if row[4] else None,
                    'combine_operator': row[5] if row[5] else 'OR'
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'tasks': tasks})
            }
        
        # POST /projects?action=toggle_task - включить/выключить задачу
        if method == 'POST' and body_data.get('action') == 'toggle_task':
            project_id = body_data.get('project_id')
            task_id = body_data.get('task_id')
            enabled = body_data.get('enabled', True)
            
            if not project_id or not task_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id and task_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Обновляем статус задачи
            cursor.execute(
                "UPDATE t_p97630513_yandex_cleaning_serv.rsya_tasks SET enabled = %s WHERE id = %s AND project_id = %s",
                (enabled, task_id, project_id)
            )
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks = []
            for row in cursor.fetchall():
                config = None
                if row[3]:
                    try:
                        config = json.loads(row[3]) if isinstance(row[3], str) else row[3]
                    except:
                        pass
                tasks.append({
                    'id': row[0],
                    'description': row[1],
                    'is_enabled': row[2],
                    'config': config,
                    'created_at': row[4].isoformat() if row[4] else None,
                    'combine_operator': row[5] if row[5] else 'OR'
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'tasks': tasks})
            }
        
        # POST /projects?action=update_task_config - обновить конфиг задачи
        if method == 'POST' and body_data.get('action') == 'update_task_config':
            project_id = body_data.get('project_id')
            task_id = body_data.get('task_id')
            config = body_data.get('config', {})
            
            if not project_id or not task_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id and task_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Обновляем конфиг задачи
            cursor.execute(
                "UPDATE t_p97630513_yandex_cleaning_serv.rsya_tasks SET config = %s WHERE id = %s AND project_id = %s",
                (json.dumps(config), task_id, project_id)
            )
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at, combine_operator FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks = []
            for row in cursor.fetchall():
                task_config = None
                if row[3]:
                    try:
                        task_config = json.loads(row[3]) if isinstance(row[3], str) else row[3]
                    except:
                        pass
                tasks.append({
                    'id': row[0],
                    'description': row[1],
                    'is_enabled': row[2],
                    'config': task_config,
                    'created_at': row[4].isoformat() if row[4] else None
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'tasks': tasks})
            }
        
        # POST /projects - создать проект (если нет action)
        if method == 'POST' and not body_data.get('action'):
            project_name = body_data.get('name', 'Новый проект')
            
            cursor.execute(
                "INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_projects (name, user_id) VALUES (%s, %s) RETURNING id, name, created_at",
                (project_name, user_id_int)
            )
            row = cursor.fetchone()
            project_id = row[0]
            
            # Создаём расписание для нового проекта (каждые 8 часов)
            cursor.execute(
                "INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_project_schedule (project_id, interval_hours, next_run_at, is_active) VALUES (%s, %s, NOW() + INTERVAL '8 hours', true)",
                (project_id, 8)
            )
            
            conn.commit()
            
            project = {
                'id': project_id,
                'name': row[1],
                'created_at': row[2].isoformat() if row[2] else None,
                'has_token': False
            }
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'project': project})
            }
        
        # PUT /projects - обновить проект
        if method == 'PUT':
            body_str = event.get('body', '{}')
            put_body_data = json.loads(body_str)
            
            project_id = put_body_data.get('project_id')
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Собираем поля для обновления
            update_fields = []
            update_values = []
            
            if 'yandex_token' in put_body_data:
                update_fields.append('yandex_token = %s')
                update_values.append(put_body_data['yandex_token'])

            if 'campaign_ids' in put_body_data:
                update_fields.append('campaign_ids = %s')
                update_values.append(json.dumps(put_body_data['campaign_ids']))
            
            if 'counter_ids' in put_body_data:
                update_fields.append('counter_ids = %s')
                update_values.append(json.dumps(put_body_data['counter_ids']))
            
            if 'auto_add_campaigns' in put_body_data:
                update_fields.append('auto_add_campaigns = %s')
                update_values.append(put_body_data['auto_add_campaigns'])
            
            if 'is_configured' in put_body_data:
                update_fields.append('is_configured = %s')
                update_values.append(put_body_data['is_configured'])
            
            if not update_fields:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'})
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            update_values.extend([project_id, user_id_int])
            
            query = f"UPDATE t_p97630513_yandex_cleaning_serv.rsya_projects SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING id"
            
            cursor.execute(query, tuple(update_values))
            row = cursor.fetchone()
            
            if not row:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Если обновили токен - добавляем проект в расписание
            if 'yandex_token' in put_body_data and put_body_data['yandex_token']:
                cursor.execute("""
                    INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_project_schedule (project_id, interval_hours, next_run_at, is_active)
                    VALUES (%s, 8, NOW(), TRUE)
                    ON CONFLICT (project_id) 
                    DO UPDATE SET is_active = TRUE, next_run_at = NOW(), updated_at = NOW()
                """, (project_id,))
            
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        # POST /setup - сохранить кампании и цели проекта
        if method == 'POST' and query_params.get('action') == 'setup':
            project_id = body_data.get('project_id')
            campaigns = body_data.get('campaigns', [])
            goals = body_data.get('goals', [])
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Удаляем старые кампании и цели
            cursor.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaigns WHERE project_id = %s", (project_id,))
            cursor.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s", (project_id,))
            
            # Сохраняем новые кампании
            for campaign in campaigns:
                cursor.execute(
                    """INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_campaigns (project_id, campaign_id, campaign_name, campaign_status, is_enabled)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT (project_id, campaign_id) DO UPDATE
                       SET campaign_name = EXCLUDED.campaign_name, campaign_status = EXCLUDED.campaign_status, updated_at = CURRENT_TIMESTAMP""",
                    (project_id, campaign['id'], campaign['name'], campaign.get('status', 'UNKNOWN'), True)
                )
            
            # Сохраняем новые цели
            for goal in goals:
                cursor.execute(
                    """INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_goals (project_id, goal_id, goal_name, is_enabled)
                       VALUES (%s, %s, %s, %s)
                       ON CONFLICT (project_id, goal_id) DO UPDATE
                       SET goal_name = EXCLUDED.goal_name, updated_at = CURRENT_TIMESTAMP""",
                    (project_id, goal['id'], goal['name'], True)
                )
            
            # Помечаем проект как настроенный
            cursor.execute(
                "UPDATE t_p97630513_yandex_cleaning_serv.rsya_projects SET is_configured = true, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (project_id,)
            )
            
            conn.commit()
            
            print(f'[DEBUG] Setup completed for project {project_id}: campaigns={len(campaigns)}, goals={len(goals)}, is_configured=true')
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'campaigns_saved': len(campaigns),
                    'goals_saved': len(goals)
                })
            }
        
        # GET /campaigns - получить сохраненные кампании и цели проекта
        if method == 'GET' and query_params.get('action') == 'campaigns':
            project_id = int(query_params.get('project_id', 0))
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Получаем кампании
            cursor.execute(
                "SELECT campaign_id, campaign_name, campaign_status, is_enabled FROM t_p97630513_yandex_cleaning_serv.rsya_campaigns WHERE project_id = %s ORDER BY campaign_name",
                (project_id,)
            )
            campaigns = []
            for row in cursor.fetchall():
                campaigns.append({
                    'id': row[0],
                    'name': row[1],
                    'status': row[2],
                    'enabled': row[3]
                })
            
            # Получаем цели
            cursor.execute(
                "SELECT goal_id, goal_name, is_enabled FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s ORDER BY goal_name",
                (project_id,)
            )
            goals = []
            for row in cursor.fetchall():
                goals.append({
                    'id': row[0],
                    'name': row[1],
                    'enabled': row[2]
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'campaigns': campaigns,
                    'goals': goals
                })
            }
        
        # POST /sync-goals - синхронизировать цели из Метрики
        if method == 'POST' and query_params.get('action') == 'sync-goals':
            body_str = event.get('body', '{}')
            body_data = json.loads(body_str)
            
            project_id = body_data.get('project_id')
            goals = body_data.get('goals', [])
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # Удаляем старые цели
            cursor.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s", (project_id,))
            
            # Сохраняем новые цели
            for goal in goals:
                cursor.execute(
                    """INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_goals (project_id, goal_id, goal_name, is_enabled)
                       VALUES (%s, %s, %s, %s)""",
                    (project_id, goal['id'], goal['name'], True)
                )
            
            conn.commit()
            
            print(f'[DEBUG] Synced {len(goals)} goals for project {project_id}')
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'goals_saved': len(goals)
                })
            }
        
        # DELETE /projects?project_id=X - удалить проект
        if method == 'DELETE':
            project_id = int(query_params.get('project_id', 0))
            
            if not project_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'project_id required'})
                }
            
            # Проверяем что проект принадлежит пользователю
            cursor.execute(
                "SELECT id FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s AND user_id = %s",
                (project_id, user_id_int)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            # 1. Удаляем block_queue
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE project_id = %s",
                (project_id,)
            )
            
            # 2. Удаляем rsya_blocking_logs
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_blocking_logs WHERE project_id = %s",
                (project_id,)
            )
            
            # 3. Удаляем rsya_cleaning_execution_logs
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE project_id = %s",
                (project_id,)
            )
            
            # 4. Удаляем все задачи проекта (это удалит и связанные записи через CASCADE)
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s",
                (project_id,)
            )
            deleted_tasks = cursor.rowcount
            print(f'🗑️  Deleted {deleted_tasks} tasks for project {project_id}')
            
            # 5. Удаляем pending батчи
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches WHERE project_id = %s",
                (project_id,)
            )
            
            # 6. Удаляем статистику площадок
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_platform_stats WHERE project_id = %s",
                (project_id,)
            )
            
            # 7. Удаляем кампании проекта
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaigns WHERE project_id = %s",
                (project_id,)
            )
            
            # 8. Удаляем цели проекта
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_goals WHERE project_id = %s",
                (project_id,)
            )
            
            # 9. Удаляем расписание проекта
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_project_schedule WHERE project_id = %s",
                (project_id,)
            )
            
            # 10. Удаляем pending reports
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_pending_reports WHERE project_id = %s",
                (project_id,)
            )
            
            # 11. Удаляем сам проект
            cursor.execute(
                "DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s",
                (project_id,)
            )
            
            conn.commit()
            print(f'✅ Project {project_id} and all related data deleted')
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        print(f'[ERROR] Database error: {str(e)}')
        import traceback
        print(f'[ERROR] Traceback: {traceback.format_exc()}')
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
