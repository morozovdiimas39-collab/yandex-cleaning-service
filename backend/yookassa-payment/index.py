'''
Создание платежа через ЮКасса для оплаты подписки
Args: event - dict с httpMethod='POST', body (userId, planType, amount), headers
      context - object с request_id
Returns: HTTP response с confirmation_url для редиректа на оплату
'''

import json
import os
import base64
import uuid
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
        user_id = body.get('userId')
        plan_type = body.get('planType')
        amount = body.get('amount')
        
        if not user_id or not plan_type or not amount:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields: userId, planType, amount'})
            }
        
        shop_id = os.environ.get('YOOKASSA_SHOP_ID')
        secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
        
        if not shop_id or not secret_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'YooKassa credentials not configured'})
            }
        
        idempotence_key = str(uuid.uuid4())
        
        auth_string = f"{shop_id}:{secret_key}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        plan_descriptions = {
            'trial': 'Пробная подписка DirectKit',
            'monthly': 'Ежемесячная подписка DirectKit',
            'annual': 'Годовая подписка DirectKit'
        }
        
        payment_data = {
            'amount': {
                'value': str(amount),
                'currency': 'RUB'
            },
            'confirmation': {
                'type': 'redirect',
                'return_url': 'https://directkit.ru/subscription?payment=success'
            },
            'capture': True,
            'description': plan_descriptions.get(plan_type, f'Подписка DirectKit - {plan_type}'),
            'receipt': {
                'customer': {
                    'email': 'info@directkit.ru'
                },
                'items': [
                    {
                        'description': plan_descriptions.get(plan_type, f'Подписка DirectKit'),
                        'quantity': '1.00',
                        'amount': {
                            'value': str(amount),
                            'currency': 'RUB'
                        },
                        'vat_code': 1,
                        'payment_mode': 'full_payment',
                        'payment_subject': 'service'
                    }
                ]
            },
            'metadata': {
                'user_id': user_id,
                'plan_type': plan_type
            }
        }
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            'https://api.yookassa.ru/v3/payments',
            json=payment_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            payment_response = response.json()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'paymentId': payment_response['id'],
                    'confirmationUrl': payment_response['confirmation']['confirmation_url'],
                    'status': payment_response['status']
                })
            }
        else:
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Payment creation failed',
                    'details': response.text
                })
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }