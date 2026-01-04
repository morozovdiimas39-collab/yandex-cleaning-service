'''
Business: Админ-панель для управления пользователями и подписками + статистика чистки РСЯ
Args: event - dict с httpMethod, body, headers (X-User-Id для проверки прав админа)
      context - object с request_id
Returns: HTTP response со списком пользователей или результатом операции
'''

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable not set')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    admin_key = headers.get('x-admin-key') or headers.get('X-Admin-Key')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        params = event.get('queryStringParameters') or {}
        action = params.get('action')
        stats_action = params.get('stats')
        
        # Админские действия с admin key (не требуют user_id)
        if action in ['analytics', 'rsya_projects', 'rsya_project_detail', 'rsya_task_detail', 'rsya_execution_detail', 'rsya_dashboard_stats', 'rsya_workers_health', 'delete_old_batches', 'delete_all_pending_batches', 'clean_campaign_locks', 'delete_project', 'delete_task', 'delete_all_projects']:
            if admin_key != 'directkit_admin_2024':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid admin key'})
                }
            
            if action == 'analytics':
                analytics_data = get_system_analytics(cur)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(analytics_data, default=str)
                }
            
            elif action == 'rsya_projects':
                projects_data = get_rsya_projects(cur)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(projects_data, default=str)
                }
            
            elif action == 'rsya_project_detail':
                project_id = params.get('project_id')
                if not project_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'project_id required'})
                    }
                
                project_data = get_rsya_project_detail(cur, int(project_id))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(project_data, default=str)
                }
            
            elif action == 'rsya_task_detail':
                task_id = params.get('task_id')
                if not task_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'task_id required'})
                    }
                
                task_data = get_rsya_task_detail(cur, int(task_id))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(task_data, default=str)
                }
            
            elif action == 'rsya_execution_detail':
                execution_id = params.get('execution_id')
                if not execution_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'execution_id required'})
                    }
                
                execution_data = get_rsya_execution_detail(cur, int(execution_id))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(execution_data, default=str)
                }
            
            elif action == 'rsya_dashboard_stats':
                dashboard_data = get_rsya_dashboard_stats(cur)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dashboard_data, default=str)
                }
            
            elif action == 'rsya_workers_health':
                workers_data = get_rsya_workers_health(cur)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(workers_data, default=str)
                }
            
            elif action == 'delete_old_batches':
                result = delete_old_batches(cur, conn)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'delete_all_pending_batches':
                result = delete_all_pending_batches(cur, conn)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'clean_campaign_locks':
                result = clean_campaign_locks(cur, conn)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'delete_project':
                project_id = params.get('project_id')
                if not project_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'project_id required'})
                    }
                
                result = delete_project(cur, conn, int(project_id))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'delete_task':
                task_id = params.get('task_id')
                if not task_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'task_id required'})
                    }
                
                result = delete_task(cur, conn, int(task_id))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            elif action == 'delete_all_projects':
                result = delete_all_projects(cur, conn)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
        
        # Для остальных действий требуется user_id
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Статистика чистки площадок - доступна всем авторизованным
        if stats_action:
            print(f'📊 Stats request: action={stats_action}, user_id={user_id}')
            try:
                stats_data = get_cleaning_stats(cur, stats_action, params)
                print(f'✅ Stats data ready: {len(str(stats_data))} bytes')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(stats_data, default=str)
                }
            except Exception as e:
                print(f'❌ Stats error: {str(e)}')
                import traceback
                print(traceback.format_exc())
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(e)})
                }
        
        # Проверяем права администратора для остальных операций
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        admin_check = cur.fetchone()
        
        if not admin_check or not admin_check.get('is_admin'):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied: admin only'})
            }
        
        # GET - список всех пользователей с подписками
        if method == 'GET':
            cur.execute("""
                SELECT 
                    u.id,
                    u.phone,
                    u.is_verified,
                    u.created_at,
                    u.last_login_at,
                    u.is_admin,
                    s.plan_type,
                    s.status,
                    s.trial_ends_at,
                    s.subscription_ends_at,
                    s.is_infinite,
                    s.allowed_services
                FROM users u
                LEFT JOIN subscriptions s ON u.id = s.user_id
                ORDER BY u.created_at DESC
            """)
            
            users = cur.fetchall()
            
            # Формируем удобный формат
            result = []
            for user in users:
                now = datetime.now()
                has_access = False
                expires_at = None
                
                if user['is_infinite']:
                    has_access = True
                    expires_at = None
                elif user['plan_type'] == 'trial' and user['trial_ends_at']:
                    if now < user['trial_ends_at']:
                        has_access = True
                        expires_at = user['trial_ends_at'].isoformat()
                elif user['plan_type'] == 'monthly' and user['subscription_ends_at']:
                    if now < user['subscription_ends_at']:
                        has_access = True
                        expires_at = user['subscription_ends_at'].isoformat()
                
                result.append({
                    'id': user['id'],
                    'phone': user['phone'],
                    'isVerified': user['is_verified'],
                    'isAdmin': user['is_admin'],
                    'createdAt': user['created_at'].isoformat() if user['created_at'] else None,
                    'lastLoginAt': user['last_login_at'].isoformat() if user['last_login_at'] else None,
                    'subscription': {
                        'planType': user['plan_type'],
                        'status': user['status'],
                        'hasAccess': has_access,
                        'expiresAt': expires_at,
                        'isInfinite': user['is_infinite'],
                        'allowedServices': user['allowed_services'] or []
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': result})
            }
        
        # POST - управление подписками
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            target_user_id = body_data.get('userId')
            action = body_data.get('action')
            
            if not target_user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId required'})
                }
            
            # Активация бесконечной подписки
            if action == 'setInfinite':
                is_infinite = body_data.get('isInfinite', True)
                services = body_data.get('services', [])
                
                # Проверяем существование подписки
                cur.execute("SELECT * FROM subscriptions WHERE user_id = %s", (target_user_id,))
                existing = cur.fetchone()
                
                if existing:
                    cur.execute(
                        """UPDATE subscriptions 
                           SET is_infinite = %s, allowed_services = %s, status = %s
                           WHERE user_id = %s""",
                        (is_infinite, services, 'active' if is_infinite else existing['status'], target_user_id)
                    )
                else:
                    cur.execute(
                        """INSERT INTO subscriptions 
                           (user_id, plan_type, status, is_infinite, allowed_services)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (target_user_id, 'infinite', 'active', is_infinite, services)
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Infinite subscription updated'})
                }
            
            # Продление обычной подписки
            elif action == 'extendSubscription':
                days = body_data.get('days', 30)
                
                cur.execute("SELECT * FROM subscriptions WHERE user_id = %s", (target_user_id,))
                existing = cur.fetchone()
                
                now = datetime.now()
                new_end_date = now + timedelta(days=days)
                
                if existing:
                    # Если подписка уже есть и активна, продлеваем от текущей даты окончания
                    if existing['subscription_ends_at'] and existing['subscription_ends_at'] > now:
                        new_end_date = existing['subscription_ends_at'] + timedelta(days=days)
                    
                    cur.execute(
                        """UPDATE subscriptions 
                           SET plan_type = %s, status = %s, 
                               subscription_started_at = %s, subscription_ends_at = %s
                           WHERE user_id = %s""",
                        ('monthly', 'active', now, new_end_date, target_user_id)
                    )
                else:
                    cur.execute(
                        """INSERT INTO subscriptions 
                           (user_id, plan_type, status, subscription_started_at, subscription_ends_at)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (target_user_id, 'monthly', 'active', now, new_end_date)
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': f'Subscription extended by {days} days'})
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()


# ==================== STATS FUNCTIONS ====================

def get_cleaning_stats(cur, action: str, params: Dict) -> Dict[str, Any]:
    '''Роутер для разных типов статистики'''
    
    if action == 'overview':
        return get_overview_stats(cur)
    elif action == 'execution_logs':
        return get_execution_logs(cur, params)
    elif action == 'blocking_logs':
        return get_blocking_logs(cur, params)
    elif action == 'queue_status':
        return get_queue_status(cur)
    elif action == 'project_stats':
        return get_project_stats(cur, params)
    else:
        return {'error': 'Invalid stats action'}


def get_overview_stats(cur) -> Dict[str, Any]:
    '''Общая статистика по всей системе чистки'''
    
    # Статистика за последние 24 часа
    cur.execute("""
        SELECT 
            execution_type,
            COUNT(*) as executions,
            SUM(placements_found) as total_found,
            SUM(placements_matched) as total_matched,
            SUM(placements_sent_to_queue) as total_sent,
            SUM(placements_blocked) as total_blocked,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
        FROM rsya_cleaning_execution_logs
        WHERE started_at > NOW() - INTERVAL '24 hours'
        GROUP BY execution_type
    """)
    
    execution_stats = cur.fetchall()
    
    # Статистика очереди
    cur.execute("""
        SELECT 
            status,
            COUNT(*) as count,
            SUM(cost) as total_cost,
            SUM(clicks) as total_clicks
        FROM block_queue
        GROUP BY status
    """)
    
    queue_stats = cur.fetchall()
    
    # Последние 10 выполнений
    cur.execute("""
        SELECT 
            l.id,
            l.execution_type,
            l.project_id,
            p.name as project_name,
            l.task_id,
            t.description as task_description,
            l.started_at,
            l.completed_at,
            l.status,
            l.placements_found,
            l.placements_matched,
            l.placements_sent_to_queue,
            l.placements_blocked,
            l.error_message
        FROM rsya_cleaning_execution_logs l
        LEFT JOIN rsya_projects p ON l.project_id = p.id
        LEFT JOIN rsya_tasks t ON l.task_id = t.id
        ORDER BY l.started_at DESC
        LIMIT 10
    """)
    
    recent_executions = cur.fetchall()
    
    # Топ проблемных площадок (много попыток блокировки)
    cur.execute("""
        SELECT 
            domain,
            COUNT(*) as attempts,
            MAX(error_message) as last_error,
            SUM(cost) as total_cost,
            SUM(clicks) as total_clicks
        FROM block_queue
        WHERE status = 'failed'
        GROUP BY domain
        ORDER BY attempts DESC
        LIMIT 10
    """)
    
    problematic_domains = cur.fetchall()
    
    return {
        'execution_stats': execution_stats,
        'queue_stats': queue_stats,
        'recent_executions': recent_executions,
        'problematic_domains': problematic_domains
    }


def get_execution_logs(cur, params: Dict) -> Dict[str, Any]:
    '''Детальные логи выполнения функций'''
    
    limit = int(params.get('limit', 50))
    project_id = params.get('project_id')
    task_id = params.get('task_id')
    execution_type = params.get('execution_type')
    
    conditions = []
    query_params = []
    
    if project_id:
        conditions.append('l.project_id = %s')
        query_params.append(project_id)
    
    if task_id:
        conditions.append('l.task_id = %s')
        query_params.append(task_id)
    
    if execution_type:
        conditions.append('l.execution_type = %s')
        query_params.append(execution_type)
    
    where_clause = 'WHERE ' + ' AND '.join(conditions) if conditions else ''
    query_params.append(limit)
    
    cur.execute(f"""
        SELECT 
            l.*,
            p.name as project_name,
            t.description as task_description,
            CASE 
                WHEN l.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (l.completed_at - l.started_at))
                ELSE NULL 
            END as duration_seconds
        FROM rsya_cleaning_execution_logs l
        LEFT JOIN rsya_projects p ON l.project_id = p.id
        LEFT JOIN rsya_tasks t ON l.task_id = t.id
        {where_clause}
        ORDER BY l.started_at DESC
        LIMIT %s
    """, query_params)
    
    logs = cur.fetchall()
    
    return {'logs': logs, 'total': len(logs)}


def get_blocking_logs(cur, params: Dict) -> Dict[str, Any]:
    '''Детальные логи блокировки площадок'''
    
    limit = int(params.get('limit', 100))
    project_id = params.get('project_id')
    task_id = params.get('task_id')
    action = params.get('block_action')
    
    conditions = []
    query_params = []
    
    if project_id:
        conditions.append('project_id = %s')
        query_params.append(project_id)
    
    if task_id:
        conditions.append('task_id = %s')
        query_params.append(task_id)
    
    if action:
        conditions.append('action = %s')
        query_params.append(action)
    
    where_clause = 'WHERE ' + ' AND '.join(conditions) if conditions else ''
    query_params.append(limit)
    
    cur.execute(f"""
        SELECT *
        FROM rsya_blocking_logs
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s
    """, query_params)
    
    logs = cur.fetchall()
    
    # Статистика по действиям
    where_params = query_params[:-1] if where_clause else []
    cur.execute(f"""
        SELECT 
            action,
            COUNT(*) as count,
            SUM(cost) as total_cost,
            SUM(clicks) as total_clicks,
            SUM(conversions) as total_conversions
        FROM rsya_blocking_logs
        {where_clause}
        GROUP BY action
    """, where_params)
    
    action_stats = cur.fetchall()
    
    return {
        'logs': logs,
        'action_stats': action_stats,
        'total': len(logs)
    }


def get_queue_status(cur) -> Dict[str, Any]:
    '''Текущее состояние очереди блокировок'''
    
    # Общая статистика очереди
    cur.execute("""
        SELECT 
            status,
            COUNT(*) as count,
            SUM(cost) as total_cost,
            SUM(clicks) as total_clicks,
            SUM(conversions) as total_conversions,
            AVG(attempts) as avg_attempts
        FROM block_queue
        GROUP BY status
    """)
    
    status_breakdown = cur.fetchall()
    
    # Старейшие pending записи
    cur.execute("""
        SELECT 
            bq.*,
            p.name as project_name,
            t.description as task_description
        FROM block_queue bq
        LEFT JOIN rsya_projects p ON bq.project_id = p.id
        LEFT JOIN rsya_tasks t ON bq.task_id = t.id
        WHERE bq.status = 'pending'
        ORDER BY bq.created_at ASC
        LIMIT 20
    """)
    
    oldest_pending = cur.fetchall()
    
    # Проблемные записи (много попыток)
    cur.execute("""
        SELECT 
            bq.*,
            p.name as project_name,
            t.description as task_description
        FROM block_queue bq
        LEFT JOIN rsya_projects p ON bq.project_id = p.id
        LEFT JOIN rsya_tasks t ON bq.task_id = t.id
        WHERE bq.attempts > 3
        ORDER BY bq.attempts DESC
        LIMIT 20
    """)
    
    high_attempts = cur.fetchall()
    
    # Сохраняем снапшот
    total = sum(s['count'] for s in status_breakdown)
    pending = next((s['count'] for s in status_breakdown if s['status'] == 'pending'), 0)
    processing = next((s['count'] for s in status_breakdown if s['status'] == 'processing'), 0)
    blocked = next((s['count'] for s in status_breakdown if s['status'] == 'blocked'), 0)
    failed = next((s['count'] for s in status_breakdown if s['status'] == 'failed'), 0)
    
    cur.execute("""
        INSERT INTO rsya_queue_snapshots 
        (pending_count, processing_count, blocked_count, failed_count, total_count)
        VALUES (%s, %s, %s, %s, %s)
    """, (pending, processing, blocked, failed, total))
    
    cur.connection.commit()
    
    return {
        'status_breakdown': status_breakdown,
        'oldest_pending': oldest_pending,
        'high_attempts': high_attempts
    }


def get_project_stats(cur, params: Dict) -> Dict[str, Any]:
    '''Статистика по конкретному проекту'''
    
    project_id = params.get('project_id')
    
    if not project_id:
        return {'error': 'project_id required'}
    
    # Общая информация о проекте
    cur.execute("""
        SELECT 
            p.*,
            COUNT(DISTINCT t.id) as tasks_count,
            COUNT(DISTINCT CASE WHEN t.enabled THEN t.id END) as active_tasks_count
        FROM rsya_projects p
        LEFT JOIN rsya_tasks t ON t.project_id = p.id
        WHERE p.id = %s
        GROUP BY p.id
    """, (project_id,))
    
    project_info = cur.fetchone()
    
    # Статистика выполнений за последние 7 дней
    cur.execute("""
        SELECT 
            DATE(started_at) as date,
            COUNT(*) as executions,
            SUM(placements_found) as total_found,
            SUM(placements_blocked) as total_blocked,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
        FROM rsya_cleaning_execution_logs
        WHERE project_id = %s 
          AND started_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(started_at)
        ORDER BY date DESC
    """, (project_id,))
    
    daily_stats = cur.fetchall()
    
    # Статистика по задачам проекта
    cur.execute("""
        SELECT 
            t.id,
            t.description,
            t.enabled,
            t.last_executed_at,
            COUNT(DISTINCT l.id) as total_executions,
            SUM(l.placements_blocked) as total_blocked,
            COUNT(CASE WHEN l.status = 'error' THEN 1 END) as errors
        FROM rsya_tasks t
        LEFT JOIN rsya_cleaning_execution_logs l ON l.task_id = t.id
        WHERE t.project_id = %s
        GROUP BY t.id, t.description, t.enabled, t.last_executed_at
        ORDER BY t.id
    """, (project_id,))
    
    tasks_stats = cur.fetchall()
    
    # Очередь по проекту
    cur.execute("""
        SELECT 
            status,
            COUNT(*) as count,
            SUM(cost) as total_cost
        FROM block_queue
        WHERE project_id = %s
        GROUP BY status
    """, (project_id,))
    
    queue_stats = cur.fetchall()
    
    return {
        'project_info': project_info,
        'daily_stats': daily_stats,
        'tasks_stats': tasks_stats,
        'queue_stats': queue_stats
    }


def get_system_analytics(cur) -> Dict[str, Any]:
    '''Общая аналитика системы для админ-панели'''
    
    # Общие метрики
    cur.execute("""
        SELECT 
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_projects) as total_projects,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE is_configured = true) as active_projects,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_tasks) as total_tasks,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE enabled = true) as active_tasks,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.users) as total_users,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.wordstat_tasks) as total_wordstat_tasks,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.block_queue) as total_block_queue
    """)
    
    overview = cur.fetchone()
    
    # Статистика РССЯ
    cur.execute("""
        SELECT 
            COUNT(*) as total_executions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
            COALESCE(SUM(placements_blocked), 0) as total_blocked,
            CASE 
                WHEN COUNT(*) > 0 THEN COALESCE(SUM(placements_blocked), 0)::FLOAT / COUNT(*)
                ELSE 0
            END as avg_blocked_per_execution
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
    """)
    
    rsya_stats = cur.fetchone()
    
    # Статистика Wordstat
    cur.execute("""
        SELECT 
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            COALESCE(SUM(keywords_count), 0) as total_keywords
        FROM t_p97630513_yandex_cleaning_serv.clustering_projects
    """)
    
    wordstat_stats = cur.fetchone()
    
    return {
        'overview': {
            'totalProjects': overview['total_projects'],
            'activeProjects': overview['active_projects'],
            'totalTasks': overview['total_tasks'],
            'activeTasks': overview['active_tasks'],
            'totalUsers': overview['total_users'],
            'totalWordstatTasks': overview['total_wordstat_tasks'],
            'totalBlockQueue': overview['total_block_queue']
        },
        'rsya': {
            'totalExecutions': rsya_stats['total_executions'],
            'successfulExecutions': rsya_stats['successful_executions'],
            'failedExecutions': rsya_stats['failed_executions'],
            'totalBlocked': int(rsya_stats['total_blocked']),
            'avgBlockedPerExecution': float(rsya_stats['avg_blocked_per_execution'])
        },
        'wordstat': {
            'pending': wordstat_stats['pending'],
            'processing': wordstat_stats['processing'],
            'completed': wordstat_stats['completed'],
            'failed': wordstat_stats['failed'],
            'totalKeywords': int(wordstat_stats['total_keywords'])
        }
    }


def get_rsya_projects(cur) -> Dict[str, Any]:
    '''Получить список всех РСЯ проектов с агрегированной статистикой'''
    
    cur.execute("""
        SELECT 
            p.id,
            p.user_id,
            p.name,
            p.client_login,
            p.is_configured,
            COUNT(DISTINCT t.id) as tasks_count,
            COUNT(DISTINCT CASE WHEN t.enabled THEN t.id END) as active_tasks_count,
            COUNT(DISTINCT l.id) as total_executions,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked,
            MAX(l.started_at) as last_execution_at
        FROM t_p97630513_yandex_cleaning_serv.rsya_projects p
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.project_id = p.id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.project_id = p.id
        GROUP BY p.id, p.user_id, p.name, p.client_login, p.is_configured
        ORDER BY p.id DESC
    """)
    
    projects = cur.fetchall()
    
    return {'projects': projects}


def get_rsya_project_detail(cur, project_id: int) -> Dict[str, Any]:
    '''Детальная информация о проекте'''
    
    # Информация о проекте
    cur.execute("""
        SELECT 
            p.*,
            COUNT(DISTINCT t.id) as tasks_count,
            COUNT(DISTINCT CASE WHEN t.enabled THEN t.id END) as active_tasks_count,
            COUNT(DISTINCT l.id) as total_executions,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked,
            COUNT(CASE WHEN l.status = 'error' THEN 1 END) as errors
        FROM t_p97630513_yandex_cleaning_serv.rsya_projects p
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.project_id = p.id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.project_id = p.id
        WHERE p.id = %s
        GROUP BY p.id
    """, (project_id,))
    
    project_info = cur.fetchone()
    
    # Статистика по задачам проекта
    cur.execute("""
        SELECT 
            t.id,
            t.description,
            t.enabled,
            t.config,
            t.last_executed_at,
            COUNT(l.id) as total_executions,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked,
            COUNT(CASE WHEN l.status = 'error' THEN 1 END) as errors
        FROM t_p97630513_yandex_cleaning_serv.rsya_tasks t
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.task_id = t.id
        WHERE t.project_id = %s
        GROUP BY t.id, t.description, t.enabled, t.config, t.last_executed_at
        ORDER BY t.id
    """, (project_id,))
    
    tasks_stats = cur.fetchall()
    
    # Статистика за последние 30 дней
    cur.execute("""
        SELECT 
            DATE(started_at) as date,
            COUNT(*) as executions,
            COALESCE(SUM(placements_blocked), 0) as total_blocked
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
        WHERE project_id = %s AND started_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(started_at)
        ORDER BY date DESC
    """, (project_id,))
    
    daily_stats = cur.fetchall()
    
    return {
        'project_info': project_info,
        'tasks_stats': tasks_stats,
        'daily_stats': daily_stats
    }


def get_rsya_task_detail(cur, task_id: int) -> Dict[str, Any]:
    '''Детальная информация о задаче'''
    
    # Информация о задаче
    cur.execute("""
        SELECT 
            t.id,
            t.project_id,
            t.description,
            t.enabled,
            t.config,
            t.created_at,
            t.last_executed_at,
            p.name as project_name,
            COUNT(l.id) as total_executions,
            COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as successful_executions,
            COUNT(CASE WHEN l.status = 'error' THEN 1 END) as failed_executions,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.block_queue 
             WHERE task_id = t.id AND status = 'pending') as pending_in_queue
        FROM t_p97630513_yandex_cleaning_serv.rsya_tasks t
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = t.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.task_id = t.id
        WHERE t.id = %s
        GROUP BY t.id, t.project_id, t.description, t.enabled, t.config, t.created_at, t.last_executed_at, p.name
    """, (task_id,))
    
    task_info = cur.fetchone()
    
    if not task_info:
        return {'error': 'Task not found'}
    
    # История выполнений (последние 50)
    cur.execute("""
        SELECT 
            l.id,
            l.execution_type,
            l.project_id,
            l.task_id,
            l.started_at,
            l.completed_at,
            l.status,
            l.request_id,
            l.placements_found,
            l.placements_matched,
            l.placements_sent_to_queue,
            l.placements_blocked,
            l.error_message,
            l.metadata,
            l.created_at,
            CASE 
                WHEN l.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (l.completed_at - l.started_at))
                ELSE NULL 
            END as duration_seconds
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l
        WHERE l.task_id = %s
        ORDER BY l.started_at DESC
        LIMIT 50
    """, (task_id,))
    
    execution_logs = cur.fetchall()
    
    return {
        'task_info': task_info,
        'project_name': task_info['project_name'],
        'execution_logs': execution_logs
    }


def get_rsya_execution_detail(cur, execution_id: int) -> Dict[str, Any]:
    '''Детальная информация о конкретном выполнении'''
    
    # Информация о выполнении
    cur.execute("""
        SELECT 
            l.*,
            p.name as project_name,
            t.description as task_description,
            CASE 
                WHEN l.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (l.completed_at - l.started_at))
                ELSE NULL 
            END as duration_seconds
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = l.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = l.task_id
        WHERE l.id = %s
    """, (execution_id,))
    
    execution = cur.fetchone()
    
    if not execution:
        return {'error': 'Execution not found'}
    
    # Список площадок, связанных с этим выполнением
    cur.execute("""
        SELECT 
            bl.domain,
            bl.cost,
            bl.clicks,
            bl.conversions,
            bl.created_at,
            bq.status,
            bq.processed_at as blocked_at,
            bq.attempts,
            bq.error_message
        FROM t_p97630513_yandex_cleaning_serv.rsya_blocking_logs bl
        LEFT JOIN t_p97630513_yandex_cleaning_serv.block_queue bq 
            ON bq.domain = bl.domain AND bq.project_id = bl.project_id
        WHERE bl.execution_id = %s
        ORDER BY bl.cost DESC
        LIMIT 200
    """, (execution_id,))
    
    platforms = cur.fetchall()
    
    return {
        'execution': execution,
        'platforms': platforms
    }


def get_rsya_dashboard_stats(cur) -> Dict[str, Any]:
    '''Расширенная статистика для дашборда РСЯ'''
    
    # KPI метрики
    cur.execute("""
        SELECT 
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_projects) as total_projects,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE is_configured = true) as active_projects,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_tasks) as total_tasks,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE enabled = true) as active_tasks,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE started_at > NOW() - INTERVAL '24 hours') as executions_24h,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE started_at > NOW() - INTERVAL '7 days') as executions_7d,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE started_at > NOW() - INTERVAL '30 days') as executions_30d,
            (SELECT COALESCE(SUM(placements_blocked), 0) FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs) as total_blocked,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE status = 'error' AND started_at > NOW() - INTERVAL '24 hours') as errors_24h,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE status = 'pending') as queue_pending,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE status = 'processing') as queue_processing,
            (SELECT COUNT(*) FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE status = 'failed') as queue_failed
    """)
    
    kpi = cur.fetchone()
    
    # График активности за 30 дней
    cur.execute("""
        SELECT 
            DATE(started_at) as date,
            COUNT(*) as executions,
            COALESCE(SUM(placements_blocked), 0) as blocked,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
        WHERE started_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(started_at)
        ORDER BY date ASC
    """)
    
    activity_chart = cur.fetchall()
    
    # Топ-5 проектов по выполнениям
    cur.execute("""
        SELECT 
            p.id,
            p.name,
            p.user_id,
            COUNT(l.id) as executions,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked
        FROM t_p97630513_yandex_cleaning_serv.rsya_projects p
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.project_id = p.id
        WHERE l.started_at > NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.user_id
        ORDER BY executions DESC
        LIMIT 5
    """)
    
    top_projects_executions = cur.fetchall()
    
    # Топ-5 проектов по блокировкам
    cur.execute("""
        SELECT 
            p.id,
            p.name,
            p.user_id,
            COALESCE(SUM(l.placements_blocked), 0) as total_blocked,
            COUNT(l.id) as executions
        FROM t_p97630513_yandex_cleaning_serv.rsya_projects p
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.project_id = p.id
        WHERE l.started_at > NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.user_id
        ORDER BY total_blocked DESC
        LIMIT 5
    """)
    
    top_projects_blocks = cur.fetchall()
    
    # Проблемные проекты (с ошибками)
    cur.execute("""
        SELECT 
            p.id,
            p.name,
            p.user_id,
            COUNT(CASE WHEN l.status = 'error' THEN 1 END) as errors,
            COUNT(l.id) as total_executions
        FROM t_p97630513_yandex_cleaning_serv.rsya_projects p
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l ON l.project_id = p.id
        WHERE l.started_at > NOW() - INTERVAL '7 days'
        GROUP BY p.id, p.name, p.user_id
        HAVING COUNT(CASE WHEN l.status = 'error' THEN 1 END) > 0
        ORDER BY errors DESC
        LIMIT 5
    """)
    
    problematic_projects = cur.fetchall()
    
    # Задачи, которые давно не выполнялись
    cur.execute("""
        SELECT 
            t.id,
            t.description,
            t.project_id,
            p.name as project_name,
            t.last_executed_at,
            EXTRACT(EPOCH FROM (NOW() - t.last_executed_at)) / 3600 as hours_since_execution
        FROM t_p97630513_yandex_cleaning_serv.rsya_tasks t
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = t.project_id
        WHERE t.enabled = true 
          AND t.last_executed_at IS NOT NULL
          AND t.last_executed_at < NOW() - INTERVAL '24 hours'
        ORDER BY t.last_executed_at ASC
        LIMIT 10
    """)
    
    stale_tasks = cur.fetchall()
    
    # Последняя активность (20 выполнений)
    cur.execute("""
        SELECT 
            l.id,
            l.execution_type,
            l.project_id,
            p.name as project_name,
            p.user_id,
            l.task_id,
            t.description as task_description,
            l.started_at,
            l.completed_at,
            l.status,
            l.placements_found,
            l.placements_blocked,
            CASE 
                WHEN l.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (l.completed_at - l.started_at))
                ELSE NULL 
            END as duration_seconds
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = l.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = l.task_id
        ORDER BY l.started_at DESC
        LIMIT 20
    """)
    
    recent_activity = cur.fetchall()
    
    # Средняя скорость блокировки (площадок/час за последние 24ч)
    avg_speed = 0
    if kpi['total_blocked'] > 0:
        cur.execute("""
            SELECT 
                COALESCE(SUM(placements_blocked), 0) as blocked_24h,
                COUNT(DISTINCT DATE_TRUNC('hour', started_at)) as active_hours
            FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
            WHERE started_at > NOW() - INTERVAL '24 hours'
        """)
        speed_data = cur.fetchone()
        if speed_data['active_hours'] > 0:
            avg_speed = float(speed_data['blocked_24h']) / float(speed_data['active_hours'])
    
    return {
        'kpi': {
            'total_projects': kpi['total_projects'],
            'active_projects': kpi['active_projects'],
            'total_tasks': kpi['total_tasks'],
            'active_tasks': kpi['active_tasks'],
            'executions_24h': kpi['executions_24h'],
            'executions_7d': kpi['executions_7d'],
            'executions_30d': kpi['executions_30d'],
            'total_blocked': int(kpi['total_blocked']),
            'errors_24h': kpi['errors_24h'],
            'queue_pending': kpi['queue_pending'],
            'queue_processing': kpi['queue_processing'],
            'queue_failed': kpi['queue_failed'],
            'avg_speed_per_hour': round(avg_speed, 2)
        },
        'activity_chart': activity_chart,
        'top_projects_executions': top_projects_executions,
        'top_projects_blocks': top_projects_blocks,
        'problematic_projects': problematic_projects,
        'stale_tasks': stale_tasks,
        'recent_activity': recent_activity
    }


def get_rsya_workers_health(cur) -> Dict[str, Any]:
    '''Статистика по воркерам и scheduler'ам для мониторинга'''
    
    # Статистика очереди блокировок
    cur.execute("""
        SELECT 
            status,
            COUNT(*) as count,
            COALESCE(SUM(cost), 0) as total_cost,
            COALESCE(AVG(attempts), 0) as avg_attempts,
            MIN(created_at) as oldest_record,
            MAX(created_at) as newest_record
        FROM t_p97630513_yandex_cleaning_serv.block_queue
        GROUP BY status
    """)
    
    queue_status = cur.fetchall()
    
    # Проблемные записи в очереди (много попыток)
    cur.execute("""
        SELECT 
            bq.id,
            bq.domain,
            bq.project_id,
            p.name as project_name,
            bq.task_id,
            t.description as task_description,
            bq.status,
            bq.attempts,
            bq.cost,
            bq.clicks,
            bq.error_message,
            bq.created_at
        FROM t_p97630513_yandex_cleaning_serv.block_queue bq
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = bq.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = bq.task_id
        WHERE bq.attempts >= 3
        ORDER BY bq.attempts DESC, bq.created_at ASC
        LIMIT 50
    """)
    
    problematic_queue = cur.fetchall()
    
    # Старые pending записи (ждут > 1 часа)
    cur.execute("""
        SELECT 
            bq.id,
            bq.domain,
            bq.project_id,
            p.name as project_name,
            bq.task_id,
            t.description as task_description,
            bq.attempts,
            bq.cost,
            bq.clicks,
            bq.created_at,
            EXTRACT(EPOCH FROM (NOW() - bq.created_at)) / 3600 as hours_waiting
        FROM t_p97630513_yandex_cleaning_serv.block_queue bq
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = bq.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = bq.task_id
        WHERE bq.status = 'pending'
          AND bq.created_at < NOW() - INTERVAL '1 hour'
        ORDER BY bq.created_at ASC
        LIMIT 50
    """)
    
    old_pending = cur.fetchall()
    
    # Статистика выполнений по типам за последние 24ч
    cur.execute("""
        SELECT 
            execution_type,
            COUNT(*) as count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
            COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0) as avg_duration_seconds,
            COALESCE(SUM(placements_blocked), 0) as total_blocked
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
        WHERE started_at > NOW() - INTERVAL '24 hours'
        GROUP BY execution_type
    """)
    
    execution_types_24h = cur.fetchall()
    
    # Активность воркеров по часам (последние 24 часа)
    cur.execute("""
        SELECT 
            DATE_TRUNC('hour', started_at) as hour,
            COUNT(*) as executions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
            COALESCE(SUM(placements_blocked), 0) as blocked
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs
        WHERE started_at > NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', started_at)
        ORDER BY hour ASC
    """)
    
    hourly_activity = cur.fetchall()
    
    # Последние ошибки воркеров
    cur.execute("""
        SELECT 
            l.id,
            l.execution_type,
            l.project_id,
            p.name as project_name,
            l.task_id,
            t.description as task_description,
            l.started_at,
            l.error_message,
            l.request_id
        FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs l
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_projects p ON p.id = l.project_id
        LEFT JOIN t_p97630513_yandex_cleaning_serv.rsya_tasks t ON t.id = l.task_id
        WHERE l.status = 'error'
          AND l.started_at > NOW() - INTERVAL '24 hours'
        ORDER BY l.started_at DESC
        LIMIT 20
    """)
    
    recent_errors = cur.fetchall()
    
    # Снапшоты очереди за последние 24 часа
    cur.execute("""
        SELECT 
            created_at,
            pending_count,
            processing_count,
            blocked_count,
            failed_count,
            total_count
        FROM t_p97630513_yandex_cleaning_serv.rsya_queue_snapshots
        WHERE created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
    """)
    
    queue_snapshots = cur.fetchall()
    
    return {
        'queue_status': queue_status,
        'problematic_queue': problematic_queue,
        'old_pending': old_pending,
        'execution_types_24h': execution_types_24h,
        'hourly_activity': hourly_activity,
        'recent_errors': recent_errors,
        'queue_snapshots': queue_snapshots
    }


def delete_old_batches(cur, conn):
    '''Удаляет pending батчи старше 24 часов'''
    cur.execute("""
        DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours'
    """)
    deleted = cur.rowcount
    conn.commit()
    
    return {
        'success': True,
        'message': f'Удалено старых pending батчей',
        'deleted': deleted
    }


def delete_all_pending_batches(cur, conn):
    '''Удаляет ВСЕ pending батчи'''
    cur.execute("""
        DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
        WHERE status = 'pending'
    """)
    deleted = cur.rowcount
    conn.commit()
    
    return {
        'success': True,
        'message': f'Удалено всех pending батчей',
        'deleted': deleted
    }


def clean_campaign_locks(cur, conn):
    '''Очищает все campaign locks'''
    cur.execute("""
        DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_locks
    """)
    deleted = cur.rowcount
    conn.commit()
    
    return {
        'success': True,
        'message': f'Очищено campaign locks',
        'deleted': deleted
    }


def delete_project(cur, conn, project_id: int):
    '''Удаляет проект и все связанные данные'''
    
    stats = {
        'tasks': 0,
        'execution_logs': 0,
        'blocking_logs': 0,
        'block_queue': 0,
        'campaign_batches': 0
    }
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_blocking_logs WHERE project_id = %s", (project_id,))
    stats['blocking_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE project_id = %s", (project_id,))
    stats['block_queue'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE project_id = %s", (project_id,))
    stats['execution_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches WHERE project_id = %s", (project_id,))
    stats['campaign_batches'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE project_id = %s", (project_id,))
    stats['tasks'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_projects WHERE id = %s", (project_id,))
    
    conn.commit()
    
    return {
        'success': True,
        'message': f'Проект удален. Задач: {stats["tasks"]}, Логов выполнений: {stats["execution_logs"]}, Логов блокировок: {stats["blocking_logs"]}, Записей в очереди: {stats["block_queue"]}, Батчей: {stats["campaign_batches"]}',
        'deleted': stats
    }


def delete_task(cur, conn, task_id: int):
    '''Удаляет задачу и все связанные данные'''
    
    stats = {
        'execution_logs': 0,
        'blocking_logs': 0,
        'block_queue': 0
    }
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_blocking_logs WHERE task_id = %s", (task_id,))
    stats['blocking_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue WHERE task_id = %s", (task_id,))
    stats['block_queue'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs WHERE task_id = %s", (task_id,))
    stats['execution_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_tasks WHERE id = %s", (task_id,))
    
    conn.commit()
    
    return {
        'success': True,
        'message': f'Задача удалена. Логов выполнений: {stats["execution_logs"]}, Логов блокировок: {stats["blocking_logs"]}, Записей в очереди: {stats["block_queue"]}',
        'deleted': stats
    }


def delete_all_projects(cur, conn):
    '''Удаляет ВСЕ проекты и все связанные данные'''
    
    stats = {
        'projects': 0,
        'tasks': 0,
        'execution_logs': 0,
        'blocking_logs': 0,
        'block_queue': 0,
        'campaign_batches': 0,
        'campaign_locks': 0,
        'task_processing_status': 0
    }
    
    # Удаляем в правильном порядке (от зависимых к главным)
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_blocking_logs")
    stats['blocking_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue")
    stats['block_queue'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs")
    stats['execution_logs'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches")
    stats['campaign_batches'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_locks")
    stats['campaign_locks'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.task_processing_status")
    stats['task_processing_status'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_tasks")
    stats['tasks'] = cur.rowcount
    
    cur.execute("DELETE FROM t_p97630513_yandex_cleaning_serv.rsya_projects")
    stats['projects'] = cur.rowcount
    
    conn.commit()
    
    return {
        'success': True,
        'message': f'Удалены ВСЕ проекты и данные. Проектов: {stats["projects"]}, Задач: {stats["tasks"]}, Логов выполнений: {stats["execution_logs"]}, Логов блокировок: {stats["blocking_logs"]}, Записей в очереди: {stats["block_queue"]}, Батчей: {stats["campaign_batches"]}, Локов: {stats["campaign_locks"]}, Статусов задач: {stats["task_processing_status"]}',
        'deleted': stats
    }