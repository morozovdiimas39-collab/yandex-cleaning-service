import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras

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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                FROM task_history th
                JOIN rsya_tasks t ON t.id = th.task_id
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
                "SELECT id, name, created_at, updated_at, (yandex_token IS NOT NULL) as has_token FROM rsya_projects WHERE user_id = %s ORDER BY created_at DESC",
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
                "SELECT id, name, yandex_token, created_at, updated_at, is_configured, client_login, campaign_ids, counter_ids, auto_add_campaigns FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                "SELECT goal_id, goal_name, counter_id, counter_name FROM rsya_goals WHERE project_id = %s AND is_enabled = true",
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
                "SELECT id, description, enabled, config, created_at FROM rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
                (project_id,)
            )
            tasks_rows = cursor.fetchall()
            tasks = []
            for t in tasks_rows:
                task = {
                    'id': t[0],
                    'description': t[1],
                    'is_enabled': t[2] or False,
                    'created_at': t[4].isoformat() if t[4] else None
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            
            cursor.execute("DELETE FROM rsya_platform_stats WHERE project_id = %s", (project_id,))
            
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
                    "INSERT INTO rsya_platform_stats (project_id, campaign_id, campaign_name, url, impressions, clicks, cost, conversions, ctr, cpc, cpa, is_blocked, status, date_from, date_to) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE - 30, CURRENT_DATE)",
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                FROM rsya_platform_stats
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            cursor.execute("DELETE FROM rsya_goals WHERE project_id = %s", (project_id,))
            
            # Добавляем новые цели
            for goal in goals:
                cursor.execute(
                    "INSERT INTO rsya_goals (project_id, goal_id, goal_name, counter_id, counter_name, is_enabled) VALUES (%s, %s, %s, %s, %s, true)",
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            
            # Создаём задачу с config
            cursor.execute(
                "INSERT INTO rsya_tasks (project_id, description, enabled, config) VALUES (%s, %s, true, %s) RETURNING id",
                (project_id, description, config)
            )
            task_id = cursor.fetchone()[0]
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at FROM rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
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
                    'created_at': row[4].isoformat() if row[4] else None
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            
            # Удаляем задачу
            cursor.execute(
                "DELETE FROM rsya_tasks WHERE id = %s AND project_id = %s",
                (task_id, project_id)
            )
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at FROM rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
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
                    'created_at': row[4].isoformat() if row[4] else None
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                "UPDATE rsya_tasks SET enabled = %s WHERE id = %s AND project_id = %s",
                (enabled, task_id, project_id)
            )
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at FROM rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
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
                    'created_at': row[4].isoformat() if row[4] else None
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                "UPDATE rsya_tasks SET config = %s WHERE id = %s AND project_id = %s",
                (json.dumps(config), task_id, project_id)
            )
            conn.commit()
            
            # Загружаем все задачи проекта
            cursor.execute(
                "SELECT id, description, enabled, config, created_at FROM rsya_tasks WHERE project_id = %s ORDER BY created_at DESC",
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
                "INSERT INTO rsya_projects (name, user_id) VALUES (%s, %s) RETURNING id, name, created_at",
                (project_name, user_id_int)
            )
            row = cursor.fetchone()
            conn.commit()
            
            project = {
                'id': row[0],
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
            
            query = f"UPDATE rsya_projects SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING id"
            
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
                    INSERT INTO rsya_project_schedule (project_id, interval_hours, next_run_at, is_active)
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            cursor.execute("DELETE FROM rsya_campaigns WHERE project_id = %s", (project_id,))
            cursor.execute("DELETE FROM rsya_goals WHERE project_id = %s", (project_id,))
            
            # Сохраняем новые кампании
            for campaign in campaigns:
                cursor.execute(
                    """INSERT INTO rsya_campaigns (project_id, campaign_id, campaign_name, campaign_status, is_enabled)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT (project_id, campaign_id) DO UPDATE
                       SET campaign_name = EXCLUDED.campaign_name, campaign_status = EXCLUDED.campaign_status, updated_at = CURRENT_TIMESTAMP""",
                    (project_id, campaign['id'], campaign['name'], campaign.get('status', 'UNKNOWN'), True)
                )
            
            # Сохраняем новые цели
            for goal in goals:
                cursor.execute(
                    """INSERT INTO rsya_goals (project_id, goal_id, goal_name, is_enabled)
                       VALUES (%s, %s, %s, %s)
                       ON CONFLICT (project_id, goal_id) DO UPDATE
                       SET goal_name = EXCLUDED.goal_name, updated_at = CURRENT_TIMESTAMP""",
                    (project_id, goal['id'], goal['name'], True)
                )
            
            # Помечаем проект как настроенный
            cursor.execute(
                "UPDATE rsya_projects SET is_configured = true, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
                "SELECT campaign_id, campaign_name, campaign_status, is_enabled FROM rsya_campaigns WHERE project_id = %s ORDER BY campaign_name",
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
                "SELECT goal_id, goal_name, is_enabled FROM rsya_goals WHERE project_id = %s ORDER BY goal_name",
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
                "SELECT id FROM rsya_projects WHERE id = %s AND user_id = %s",
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
            cursor.execute("DELETE FROM rsya_goals WHERE project_id = %s", (project_id,))
            
            # Сохраняем новые цели
            for goal in goals:
                cursor.execute(
                    """INSERT INTO rsya_goals (project_id, goal_id, goal_name, is_enabled)
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
            
            cursor.execute(
                "DELETE FROM rsya_projects WHERE id = %s AND user_id = %s RETURNING id",
                (project_id, user_id_int)
            )
            row = cursor.fetchone()
            
            if not row:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
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