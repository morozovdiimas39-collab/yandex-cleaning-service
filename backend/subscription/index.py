'''
Business: Управление подписками пользователей - проверка доступа, активация триала и платной подписки
Args: event - dict с httpMethod, body, headers (X-User-Id)
      context - object с request_id
Returns: HTTP response с информацией о подписке
'''

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    admin_key = headers.get('x-admin-key') or headers.get('X-Admin-Key')
    query_params = event.get('queryStringParameters') or {}
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Админские эндпоинты
        if admin_key == 'directkit_admin_2024':
            # GET admin_all - получить всех пользователей
            if method == 'GET' and query_params.get('action') == 'admin_all':
                limit = int(query_params.get('limit', 100))
                offset = int(query_params.get('offset', 0))
                
                cur.execute(
                    """SELECT s.user_id, s.plan_type, s.status, 
                              s.trial_started_at, s.trial_ends_at,
                              s.subscription_started_at, s.subscription_ends_at,
                              s.created_at, s.updated_at,
                              u.phone
                       FROM subscriptions s
                       LEFT JOIN users u ON s.user_id = CAST(u.id AS TEXT)
                       ORDER BY s.created_at DESC
                       LIMIT %s OFFSET %s""",
                    (limit, offset)
                )
                subscriptions = cur.fetchall()
                
                cur.execute("SELECT COUNT(*) as total FROM subscriptions")
                total = cur.fetchone()['total']
                
                users = []
                now = datetime.now()
                
                for sub in subscriptions:
                    has_access = False
                    expires_at = None
                    
                    if sub['plan_type'] == 'trial' and sub['trial_ends_at']:
                        has_access = now < sub['trial_ends_at']
                        expires_at = sub['trial_ends_at'].isoformat()
                    elif sub['plan_type'] == 'monthly' and sub['subscription_ends_at']:
                        has_access = now < sub['subscription_ends_at']
                        expires_at = sub['subscription_ends_at'].isoformat()
                    
                    users.append({
                        'userId': sub['user_id'],
                        'phone': sub.get('phone', ''),
                        'planType': sub['plan_type'],
                        'status': sub['status'],
                        'hasAccess': has_access,
                        'expiresAt': expires_at,
                        'createdAt': sub['created_at'].isoformat() if sub['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'users': users,
                        'total': total,
                        'limit': limit,
                        'offset': offset,
                        'hasMore': (offset + limit) < total
                    })
                }
            
            # POST admin_update - обновить подписку любого пользователя
            if method == 'POST' and query_params.get('action') == 'admin_update':
                body_data = json.loads(event.get('body', '{}'))
                target_user_id = body_data.get('userId')
                plan_type = body_data.get('planType', 'trial')
                days = int(body_data.get('days', 1))
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId required'})
                    }
                
                cur.execute("SELECT * FROM subscriptions WHERE user_id = %s", (target_user_id,))
                existing = cur.fetchone()
                
                now = datetime.now()
                ends_at = now + timedelta(days=days)
                
                if existing:
                    if plan_type == 'trial':
                        cur.execute(
                            """UPDATE subscriptions 
                               SET plan_type = %s, status = %s, 
                                   trial_started_at = %s, trial_ends_at = %s,
                                   updated_at = %s
                               WHERE user_id = %s""",
                            ('trial', 'active', now, ends_at, now, target_user_id)
                        )
                    else:
                        cur.execute(
                            """UPDATE subscriptions 
                               SET plan_type = %s, status = %s,
                                   subscription_started_at = %s, subscription_ends_at = %s,
                                   updated_at = %s
                               WHERE user_id = %s""",
                            ('monthly', 'active', now, ends_at, now, target_user_id)
                        )
                else:
                    if plan_type == 'trial':
                        cur.execute(
                            """INSERT INTO subscriptions 
                               (user_id, plan_type, status, trial_started_at, trial_ends_at)
                               VALUES (%s, %s, %s, %s, %s)""",
                            (target_user_id, 'trial', 'active', now, ends_at)
                        )
                    else:
                        cur.execute(
                            """INSERT INTO subscriptions 
                               (user_id, plan_type, status, subscription_started_at, subscription_ends_at)
                               VALUES (%s, %s, %s, %s, %s)""",
                            (target_user_id, 'monthly', 'active', now, ends_at)
                        )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'userId': target_user_id})
                }
            
            # DELETE admin_delete - удалить подписку
            if method == 'DELETE' and query_params.get('action') == 'admin_delete':
                target_user_id = query_params.get('userId')
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId required'})
                    }
                
                cur.execute("DELETE FROM subscriptions WHERE user_id = %s", (target_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            # GET admin_stats - статистика
            if method == 'GET' and query_params.get('action') == 'admin_stats':
                now = datetime.now()
                
                cur.execute("SELECT COUNT(*) as total FROM subscriptions")
                total = cur.fetchone()['total']
                
                cur.execute(
                    """SELECT COUNT(*) as count FROM subscriptions 
                       WHERE plan_type = 'trial' AND trial_ends_at > %s""",
                    (now,)
                )
                active_trial = cur.fetchone()['count']
                
                cur.execute(
                    """SELECT COUNT(*) as count FROM subscriptions 
                       WHERE plan_type = 'monthly' AND subscription_ends_at > %s""",
                    (now,)
                )
                active_monthly = cur.fetchone()['count']
                
                cur.execute(
                    """SELECT COUNT(*) as count FROM subscriptions 
                       WHERE created_at >= %s""",
                    (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),)
                )
                new_today = cur.fetchone()['count']
                
                week_later = now + timedelta(days=7)
                cur.execute(
                    """SELECT COUNT(*) as count FROM subscriptions 
                       WHERE (trial_ends_at BETWEEN %s AND %s) 
                          OR (subscription_ends_at BETWEEN %s AND %s)""",
                    (now, week_later, now, week_later)
                )
                expiring_week = cur.fetchone()['count']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'total': total,
                        'activeTrial': active_trial,
                        'activeMonthly': active_monthly,
                        'newToday': new_today,
                        'expiringWeek': expiring_week
                    })
                }
        
        # Обычные пользовательские эндпоинты
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID required'})
            }
        
        # GET - проверка статуса подписки
        if method == 'GET':
            cur.execute(
                "SELECT * FROM subscriptions WHERE user_id = %s",
                (user_id,)
            )
            subscription = cur.fetchone()
            
            if not subscription:
                trial_started = datetime.now()
                trial_ends = trial_started + timedelta(days=1)
                
                cur.execute(
                    """INSERT INTO subscriptions 
                       (user_id, plan_type, status, trial_started_at, trial_ends_at)
                       VALUES (%s, %s, %s, %s, %s)
                       RETURNING *""",
                    (user_id, 'trial', 'active', trial_started, trial_ends)
                )
                subscription = cur.fetchone()
                conn.commit()
            
            now = datetime.now()
            has_access = False
            expires_at = None
            
            if subscription['plan_type'] == 'trial':
                if subscription['trial_ends_at'] and now < subscription['trial_ends_at']:
                    has_access = True
                    expires_at = subscription['trial_ends_at'].isoformat()
                elif subscription['status'] == 'active':
                    cur.execute(
                        "UPDATE subscriptions SET status = %s WHERE user_id = %s",
                        ('expired', user_id)
                    )
                    conn.commit()
            
            elif subscription['plan_type'] == 'monthly':
                if subscription['subscription_ends_at'] and now < subscription['subscription_ends_at']:
                    has_access = True
                    expires_at = subscription['subscription_ends_at'].isoformat()
                elif subscription['status'] == 'active':
                    cur.execute(
                        "UPDATE subscriptions SET status = %s WHERE user_id = %s",
                        ('expired', user_id)
                    )
                    conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'hasAccess': has_access,
                    'planType': subscription['plan_type'],
                    'status': subscription['status'],
                    'expiresAt': expires_at,
                    'trialEndsAt': subscription['trial_ends_at'].isoformat() if subscription['trial_ends_at'] else None
                })
            }
        
        # POST - активация платной подписки
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'activate':
                cur.execute(
                    "SELECT * FROM subscriptions WHERE user_id = %s",
                    (user_id,)
                )
                existing = cur.fetchone()
                
                subscription_started = datetime.now()
                subscription_ends = subscription_started + timedelta(days=30)
                
                if existing:
                    cur.execute(
                        """UPDATE subscriptions 
                           SET plan_type = %s, status = %s, 
                               subscription_started_at = %s, subscription_ends_at = %s
                           WHERE user_id = %s
                           RETURNING *""",
                        ('monthly', 'active', subscription_started, subscription_ends, user_id)
                    )
                else:
                    cur.execute(
                        """INSERT INTO subscriptions 
                           (user_id, plan_type, status, subscription_started_at, subscription_ends_at)
                           VALUES (%s, %s, %s, %s, %s)
                           RETURNING *""",
                        (user_id, 'monthly', 'active', subscription_started, subscription_ends)
                    )
                
                subscription = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'subscription': {
                            'planType': subscription['plan_type'],
                            'status': subscription['status'],
                            'expiresAt': subscription['subscription_ends_at'].isoformat()
                        }
                    })
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