'''
Webhook для обработки уведомлений от ЮКасса о статусе платежа
Args: event - dict с httpMethod='POST', body (notification от YooKassa)
      context - object с request_id
Returns: HTTP 200 для подтверждения получения webhook
'''

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        notification_type = body.get('event')
        payment_object = body.get('object', {})
        
        if notification_type != 'payment.succeeded':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Notification received but not processed'})
            }
        
        payment_id = payment_object.get('id')
        status = payment_object.get('status')
        metadata = payment_object.get('metadata', {})
        
        user_id = metadata.get('user_id')
        plan_type = metadata.get('plan_type')
        
        if not user_id or not plan_type or status != 'succeeded':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Payment not succeeded or missing metadata'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        now = datetime.now()
        
        if plan_type == 'monthly':
            subscription_ends_at = now + timedelta(days=30)
        elif plan_type == 'annual':
            subscription_ends_at = now + timedelta(days=365)
        else:
            subscription_ends_at = now + timedelta(days=30)
        
        cur.execute(
            """INSERT INTO subscriptions (user_id, plan_type, status, subscription_started_at, subscription_ends_at, created_at, updated_at)
               VALUES (%s, %s, 'active', %s, %s, %s, %s)
               ON CONFLICT (user_id) 
               DO UPDATE SET 
                   plan_type = EXCLUDED.plan_type,
                   status = 'active',
                   subscription_started_at = EXCLUDED.subscription_started_at,
                   subscription_ends_at = EXCLUDED.subscription_ends_at,
                   updated_at = EXCLUDED.updated_at""",
            (user_id, plan_type, now, subscription_ends_at, now, now)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Subscription activated successfully',
                'userId': user_id,
                'planType': plan_type,
                'expiresAt': subscription_ends_at.isoformat()
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
