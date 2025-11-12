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
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        params = event.get('queryStringParameters') or {}
        stats_action = params.get('stats')
        
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
            EXTRACT(EPOCH FROM (l.completed_at - l.started_at)) as duration_seconds
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
