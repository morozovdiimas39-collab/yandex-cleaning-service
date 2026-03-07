'''
Business: Управление подписками пользователей v2 - проверка доступа, активация триала и платной подписки
Args: event - dict с httpMethod, body, headers (X-User-Id)
      context - object с request_id
Returns: HTTP response с информацией о подписке
Updated: 2025-11-20 credentials refresh
'''

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

SCHEMA = 't_p97630513_yandex_cleaning_serv'

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found in environment')
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
                # Список всех пользователей из users + подписка (схема обязательна)
                cur.execute(
                    f"""SELECT u.id, u.phone, u.created_at,
                              s.user_id AS sub_user_id, s.plan_type, s.status,
                              s.trial_started_at, s.trial_ends_at,
                              s.subscription_started_at, s.subscription_ends_at,
                              s.created_at AS sub_created_at
                       FROM {SCHEMA}.users u
                       LEFT JOIN {SCHEMA}.subscriptions s ON s.user_id = CAST(u.id AS TEXT)
                       ORDER BY u.created_at DESC
                       LIMIT %s OFFSET %s""",
                    (limit, offset)
                )
                rows = cur.fetchall()
                cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.users")
                total = cur.fetchone()['total']
                users = []
                now = datetime.now()
                for row in rows:
                    sub_plan = row.get('plan_type')
                    sub_trial_ends = row.get('trial_ends_at')
                    sub_ends = row.get('subscription_ends_at')
                    has_access = False
                    expires_at = None
                    if sub_plan == 'trial' and sub_trial_ends:
                        has_access = now < sub_trial_ends
                        expires_at = sub_trial_ends.isoformat()
                    elif sub_plan == 'monthly' and sub_ends:
                        has_access = now < sub_ends
                        expires_at = sub_ends.isoformat()
                    users.append({
                        'userId': str(row['id']),
                        'phone': row.get('phone', ''),
                        'planType': sub_plan or 'trial',
                        'status': row.get('status') or 'active',
                        'hasAccess': has_access,
                        'expiresAt': expires_at,
                        'createdAt': row['created_at'].isoformat() if row.get('created_at') else None
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
                
                cur.execute(f"SELECT * FROM {SCHEMA}.subscriptions WHERE user_id = %s", (target_user_id,))
                existing = cur.fetchone()
                
                now = datetime.now()
                ends_at = now + timedelta(days=days)
                
                if existing:
                    if plan_type == 'trial':
                        cur.execute(
                            f"""UPDATE {SCHEMA}.subscriptions 
                               SET plan_type = %s, status = %s, 
                                   trial_started_at = %s, trial_ends_at = %s,
                                   updated_at = %s
                               WHERE user_id = %s""",
                            ('trial', 'active', now, ends_at, now, target_user_id)
                        )
                    else:
                        cur.execute(
                            f"""UPDATE {SCHEMA}.subscriptions 
                               SET plan_type = %s, status = %s,
                                   subscription_started_at = %s, subscription_ends_at = %s,
                                   updated_at = %s
                               WHERE user_id = %s""",
                            ('monthly', 'active', now, ends_at, now, target_user_id)
                        )
                else:
                    if plan_type == 'trial':
                        cur.execute(
                            f"""INSERT INTO {SCHEMA}.subscriptions 
                               (user_id, plan_type, status, trial_started_at, trial_ends_at)
                               VALUES (%s, %s, %s, %s, %s)""",
                            (target_user_id, 'trial', 'active', now, ends_at)
                        )
                    else:
                        cur.execute(
                            f"""INSERT INTO {SCHEMA}.subscriptions 
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
                
                cur.execute(f"DELETE FROM {SCHEMA}.subscriptions WHERE user_id = %s", (target_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            # GET admin_affiliates - статистика партнеров
            if method == 'GET' and query_params.get('action') == 'admin_affiliates':
                cur.execute("""
                    SELECT 
                        p.user_id,
                        p.referral_code,
                        p.commission_rate,
                        p.total_earned,
                        p.total_referrals,
                        p.is_active
                    FROM t_p97630513_yandex_cleaning_serv.partners p
                    ORDER BY p.total_earned DESC
                """)
                partners = cur.fetchall()
                
                cur.execute("""
                    SELECT 
                        r.id,
                        r.partner_id,
                        r.referred_user_id,
                        u.phone,
                        r.status,
                        r.commission_amount,
                        r.created_at,
                        r.paid_at
                    FROM t_p97630513_yandex_cleaning_serv.referrals r
                    LEFT JOIN t_p97630513_yandex_cleaning_serv.users u ON r.referred_user_id = u.id
                    ORDER BY r.created_at DESC
                    LIMIT 100
                """)
                referrals = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'partners': [{
                            'user_id': p['user_id'],
                            'referral_code': p['referral_code'],
                            'commission_rate': float(p['commission_rate']),
                            'total_earned': float(p['total_earned']),
                            'total_referrals': p['total_referrals'],
                            'is_active': p['is_active']
                        } for p in partners],
                        'referrals': [{
                            'id': r['id'],
                            'partner_id': r['partner_id'],
                            'referred_user_id': r['referred_user_id'],
                            'phone': r['phone'],
                            'status': r['status'],
                            'commission_amount': float(r['commission_amount']) if r['commission_amount'] else 0,
                            'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                            'paid_at': r['paid_at'].isoformat() if r['paid_at'] else None
                        } for r in referrals]
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            # GET admin_stats - статистика
            if method == 'GET' and query_params.get('action') == 'admin_stats':
                now = datetime.now()
                
                cur.execute(f"SELECT COUNT(*) as total FROM {SCHEMA}.subscriptions")
                total = cur.fetchone()['total']
                
                cur.execute(
                    f"""SELECT COUNT(*) as count FROM {SCHEMA}.subscriptions 
                       WHERE plan_type = 'trial' AND trial_ends_at > %s""",
                    (now,)
                )
                active_trial = cur.fetchone()['count']
                
                cur.execute(
                    f"""SELECT COUNT(*) as count FROM {SCHEMA}.subscriptions 
                       WHERE plan_type = 'monthly' AND subscription_ends_at > %s""",
                    (now,)
                )
                active_monthly = cur.fetchone()['count']
                
                cur.execute(
                    f"""SELECT COUNT(*) as count FROM {SCHEMA}.subscriptions 
                       WHERE created_at >= %s""",
                    (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),)
                )
                new_today = cur.fetchone()['count']
                
                week_later = now + timedelta(days=7)
                cur.execute(
                    f"""SELECT COUNT(*) as count FROM {SCHEMA}.subscriptions 
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
        
        # GET - проверка статуса подписки (пока сервис бесплатный — всегда доступ)
        if method == 'GET':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'hasAccess': True,
                    'planType': 'free',
                    'status': 'active',
                    'expiresAt': None
                })
            )
        
        # POST - активация платной подписки или создание платежа (пока не используется)
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            # Создание платежа через Альфа-Банк
            if action == 'create_payment':
                amount = body_data.get('amount')
                plan = body_data.get('plan', 'monthly')
                
                print(f'💳 Creating payment: user_id={user_id}, amount={amount}, plan={plan}')
                
                if not amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing amount'})
                    }
                
                alfabank_login = os.environ.get('ALFABANK_LOGIN')
                alfabank_password = os.environ.get('ALFABANK_PASSWORD')
                
                # TEMPORARY WORKAROUND: hardcoded password until secrets are fixed
                if not alfabank_password:
                    alfabank_password = 'Qwerty22456!'
                
                print(f'🔑 Credentials: login={alfabank_login[:3] if alfabank_login else "None"}*** (len={len(alfabank_login) if alfabank_login else 0}), password={"*" * len(alfabank_password) if alfabank_password else "None"}')
                
                if not alfabank_login or not alfabank_password:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Alfabank credentials not configured'})
                    }
                
                order_number = f"{user_id}_{plan}_{int(context.request_id[:8], 16)}"
                
                api_url = 'https://pay.alfabank.ru/payment/rest/register.do'
                
                payload = {
                    'userName': alfabank_login,
                    'password': alfabank_password,
                    'gateway': '773502993200',
                    'orderNumber': order_number,
                    'amount': int(amount * 100),
                    'returnUrl': f'https://devdirectkit.ru/subscription?payment=success&order={order_number}&plan={plan}',
                    'failUrl': 'https://devdirectkit.ru/subscription?payment=failed',
                    'description': f'Подписка DirectKit - 1 месяц',
                    'jsonParams': json.dumps({
                        'user_id': user_id,
                        'plan': plan
                    })
                }
                
                print(f'📤 Sending to Alfabank: order={order_number}, amount={payload["amount"]}, gateway={payload["gateway"]}')
                
                response = requests.post(api_url, data=payload, timeout=10)
                
                print(f'📥 Alfabank response: status={response.status_code}')
                
                if response.status_code == 200:
                    data = response.json()
                    print(f'📋 Response data: {data}')
                    
                    if 'formUrl' in data:
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'success': True,
                                'payment_url': data['formUrl'],
                                'order_id': data.get('orderId'),
                                'order_number': order_number
                            })
                        }
                    else:
                        print(f'❌ No formUrl in response: {data}')
                        return {
                            'statusCode': 500,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'error': 'Payment creation failed',
                                'details': data
                            })
                        }
                else:
                    print(f'❌ Bad status code: {response.status_code}, text: {response.text}')
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Alfabank API error: {response.status_code}'})
                    }
            
            # Проверка статуса платежа
            if action == 'check_payment':
                order_number = body_data.get('orderNumber')
                plan = body_data.get('plan', 'monthly')
                
                if not order_number:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing orderNumber'})
                    }
                
                alfabank_login = os.environ.get('ALFABANK_LOGIN')
                alfabank_password = os.environ.get('ALFABANK_PASSWORD')
                
                api_url = 'https://pay.alfabank.ru/payment/rest/getOrderStatusExtended.do'
                
                payload = {
                    'userName': alfabank_login,
                    'password': alfabank_password,
                    'orderNumber': order_number
                }
                
                response = requests.post(api_url, data=payload, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    order_status = data.get('orderStatus')
                    
                    is_paid = order_status == 2
                    
                    if is_paid:
                        cur.execute(f"SELECT * FROM {SCHEMA}.subscriptions WHERE user_id = %s", (user_id,))
                        existing = cur.fetchone()
                        
                        now = datetime.now()
                        
                        if plan == 'monthly':
                            days = 30
                        elif plan == 'quarterly':
                            days = 90
                        elif plan == 'yearly':
                            days = 365
                        else:
                            days = 30
                        
                        ends_at = now + timedelta(days=days)
                        
                        subscription_id = None
                        
                        if existing:
                            cur.execute(
                                f"""UPDATE {SCHEMA}.subscriptions 
                                   SET plan_type = %s, status = %s,
                                       subscription_started_at = %s, subscription_ends_at = %s,
                                       updated_at = %s
                                   WHERE user_id = %s
                                   RETURNING id""",
                                ('monthly', 'active', now, ends_at, now, user_id)
                            )
                            subscription_id = cur.fetchone()['id']
                        else:
                            cur.execute(
                                f"""INSERT INTO {SCHEMA}.subscriptions 
                                   (user_id, plan_type, status, subscription_started_at, subscription_ends_at)
                                   VALUES (%s, %s, %s, %s, %s)
                                   RETURNING id""",
                                (user_id, 'monthly', 'active', now, ends_at)
                            )
                            subscription_id = cur.fetchone()['id']
                        
                        # Начисляем комиссию партнеру, если есть реферал
                        payment_amount = data.get('amount', 0) / 100  # из копеек в рубли
                        
                        cur.execute("""
                            SELECT r.id, r.partner_id, p.commission_rate
                            FROM t_p97630513_yandex_cleaning_serv.referrals r
                            JOIN t_p97630513_yandex_cleaning_serv.partners p ON r.partner_id = p.id
                            WHERE r.referred_user_id = %s AND p.is_active = true
                        """, (int(user_id),))
                        
                        referral = cur.fetchone()
                        
                        if referral:
                            commission = payment_amount * (float(referral['commission_rate']) / 100)
                            
                            # Обновляем реферала
                            cur.execute("""
                                UPDATE t_p97630513_yandex_cleaning_serv.referrals
                                SET 
                                    subscription_id = %s,
                                    commission_amount = COALESCE(commission_amount, 0) + %s,
                                    status = 'paid',
                                    paid_at = NOW()
                                WHERE id = %s
                            """, (subscription_id, commission, referral['id']))
                            
                            # Обновляем заработок партнера
                            cur.execute("""
                                UPDATE t_p97630513_yandex_cleaning_serv.partners
                                SET total_earned = total_earned + %s
                                WHERE id = %s
                            """, (commission, referral['partner_id']))
                        
                        conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'is_paid': is_paid,
                            'status': order_status,
                            'status_text': {
                                0: 'Заказ зарегистрирован',
                                1: 'Предавторизован',
                                2: 'Оплачен',
                                3: 'Отменён',
                                4: 'Возвращён',
                                5: 'Инициирована авторизация',
                                6: 'Отклонён'
                            }.get(order_status, 'Неизвестный статус'),
                            'data': data
                        })
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to check payment status'})
                    }
            
            if action == 'activate':
                cur.execute(
                    f"SELECT * FROM {SCHEMA}.subscriptions WHERE user_id = %s",
                    (user_id,)
                )
                existing = cur.fetchone()
                
                subscription_started = datetime.now()
                subscription_ends = subscription_started + timedelta(days=30)
                
                if existing:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.subscriptions 
                           SET plan_type = %s, status = %s, 
                               subscription_started_at = %s, subscription_ends_at = %s
                           WHERE user_id = %s
                           RETURNING *""",
                        ('monthly', 'active', subscription_started, subscription_ends, user_id)
                    )
                else:
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.subscriptions 
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
            
            # Партнерская программа - получение статистики
            if action == 'affiliate_stats':
                print(f'🔍 Getting partner for user_id={user_id}')
                # Получаем или создаем партнера
                cur.execute("""
                    SELECT id, referral_code, commission_rate, total_earned, total_referrals, is_active
                    FROM t_p97630513_yandex_cleaning_serv.partners
                    WHERE user_id = %s
                """, (int(user_id),))
                print('✅ Partner query executed')
                
                partner = cur.fetchone()
                
                if not partner:
                    # Создаем партнера
                    referral_code = f"DK{str(user_id).zfill(8)}"
                    cur.execute("""
                        INSERT INTO t_p97630513_yandex_cleaning_serv.partners 
                        (user_id, referral_code, commission_rate, total_earned, total_referrals, is_active)
                        VALUES (%s, %s, 20.00, 0, 0, true)
                        RETURNING id, referral_code, commission_rate, total_earned, total_referrals, is_active
                    """, (int(user_id), referral_code))
                    
                    partner = cur.fetchone()
                    conn.commit()
                
                # Получаем статистику рефералов
                print(f'📊 Getting stats for partner_id={partner["id"]}')
                cur.execute("""
                    SELECT 
                        COUNT(*) as total_referrals,
                        COUNT(CASE WHEN r.status = 'paid' THEN 1 END) as conversions,
                        COALESCE(SUM(r.commission_amount), 0) as total_earned
                    FROM t_p97630513_yandex_cleaning_serv.referrals r
                    WHERE r.partner_id = %s
                """, (partner['id'],))
                print('✅ Stats query executed')
                
                stats = cur.fetchone()
                
                # Получаем список рефералов
                print(f'📝 Getting referrals list for partner_id={partner["id"]}')
                cur.execute("""
                    SELECT 
                        r.id,
                        r.referred_user_id,
                        u.phone,
                        r.status,
                        r.commission_amount,
                        r.created_at,
                        r.paid_at,
                        s.plan_type
                    FROM t_p97630513_yandex_cleaning_serv.referrals r
                    LEFT JOIN t_p97630513_yandex_cleaning_serv.users u ON r.referred_user_id = u.id
                    LEFT JOIN t_p97630513_yandex_cleaning_serv.subscriptions s ON r.subscription_id = s.id
                    WHERE r.partner_id = %s
                    ORDER BY r.created_at DESC
                    LIMIT 100
                """, (partner['id'],))
                print('✅ Referrals list query executed')
                
                referrals = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'partner': {
                            'id': partner['id'],
                            'referral_code': partner['referral_code'],
                            'commission_rate': float(partner['commission_rate']),
                            'is_active': partner['is_active']
                        },
                        'stats': {
                            'referrals': stats['total_referrals'],
                            'conversions': stats['conversions'],
                            'earnings': float(stats['total_earned'])
                        },
                        'referrals': [{
                            'id': r['id'],
                            'user_id': r['referred_user_id'],
                            'phone': r['phone'],
                            'status': r['status'],
                            'commission': float(r['commission_amount']) if r['commission_amount'] else 0,
                            'plan_type': r['plan_type'],
                            'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                            'paid_at': r['paid_at'].isoformat() if r['paid_at'] else None
                        } for r in referrals]
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            # Регистрация реферала
            if action == 'register_referral':
                referral_code = body_data.get('referral_code')
                new_user_id = body_data.get('new_user_id', user_id)
                
                if not referral_code:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'No referral code'}),
                        'isBase64Encoded': False
                    }
                
                # Находим партнера по коду
                cur.execute("""
                    SELECT id FROM t_p97630513_yandex_cleaning_serv.partners
                    WHERE referral_code = %s AND is_active = true
                """, (referral_code,))
                
                partner = cur.fetchone()
                
                if not partner:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Invalid code'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, не зарегистрирован ли уже этот пользователь
                cur.execute("""
                    SELECT id FROM t_p97630513_yandex_cleaning_serv.referrals
                    WHERE referred_user_id = %s
                """, (int(new_user_id),))
                
                if cur.fetchone():
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Already registered'}),
                        'isBase64Encoded': False
                    }
                
                # Создаем реферала
                cur.execute("""
                    INSERT INTO t_p97630513_yandex_cleaning_serv.referrals
                    (partner_id, referred_user_id, status)
                    VALUES (%s, %s, 'pending')
                    RETURNING id
                """, (partner['id'], int(new_user_id)))
                
                referral = cur.fetchone()
                
                # Обновляем счетчик рефералов
                cur.execute("""
                    UPDATE t_p97630513_yandex_cleaning_serv.partners
                    SET total_referrals = total_referrals + 1
                    WHERE id = %s
                """, (partner['id'],))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'referral_id': referral['id']
                    }),
                    'isBase64Encoded': False
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