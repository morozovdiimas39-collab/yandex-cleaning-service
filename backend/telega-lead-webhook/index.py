import json
import os
import psycopg2
import requests
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''
    Приём заявки с сайта → отправка в Telegram с кнопками
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return error_response('Method not allowed', 405)
    
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return error_response('Invalid JSON', 400)
    
    project_id = body.get('project_id')
    phone = body.get('phone')
    name = body.get('name', '')
    course = body.get('course', '')
    
    if not all([project_id, phone]):
        return error_response('project_id and phone required', 400)
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Получаем данные проекта (bot_token, telegram_chat_id)
        cur.execute('''
            SELECT bot_token, telegram_chat_id
            FROM telega_crm_projects
            WHERE id = %s
        ''', (project_id,))
        
        row = cur.fetchone()
        if not row:
            return error_response('Project not found', 404)
        
        bot_token, chat_id = row
        
        # Сохраняем заявку в БД
        cur.execute('''
            INSERT INTO telega_crm_leads (project_id, phone, name, course, status)
            VALUES (%s, %s, %s, %s, 'new')
            RETURNING id
        ''', (project_id, phone, name, course))
        
        lead_id = cur.fetchone()[0]
        
        # Отправляем в Telegram
        message_text = f"🔔 <b>НОВАЯ ЗАЯВКА</b>\\n\\n"
        message_text += f"📞 Телефон: {phone}\\n"
        if name:
            message_text += f"👤 Имя: {name}\\n"
        if course:
            message_text += f"🎓 Курс: {course}\\n"
        message_text += f"📅 Дата: {datetime.now().strftime('%d.%m.%Y в %H:%M')}"
        
        # Кнопки статусов
        keyboard = {
            'inline_keyboard': [
                [
                    {'text': '☎️ Позвонил клиенту', 'callback_data': f'status:{lead_id}:called'}
                ],
                [
                    {'text': '✅ Записался на пробное', 'callback_data': f'status:{lead_id}:trial'},
                    {'text': '📝 Записался на обучение', 'callback_data': f'status:{lead_id}:enrolled'}
                ],
                [
                    {'text': '🤔 Думает', 'callback_data': f'status:{lead_id}:thinking'},
                    {'text': '❌ Нецелевой', 'callback_data': f'status:{lead_id}:rejected'}
                ]
            ]
        }
        
        telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        telegram_data = {
            'chat_id': chat_id,
            'text': message_text,
            'parse_mode': 'HTML',
            'reply_markup': json.dumps(keyboard)
        }
        
        response = requests.post(telegram_url, json=telegram_data, timeout=10)
        
        if response.status_code != 200:
            print(f'Telegram API error: {response.text}')
            return error_response('Failed to send to Telegram', 500)
        
        telegram_response = response.json()
        message_id = telegram_response.get('result', {}).get('message_id')
        
        # Сохраняем message_id для будущих обновлений
        if message_id:
            cur.execute('''
                UPDATE telega_crm_leads
                SET telegram_message_id = %s
                WHERE id = %s
            ''', (message_id, lead_id))
        
        return success_response({
            'success': True,
            'lead_id': lead_id,
            'telegram_message_id': message_id
        })
        
    except Exception as e:
        print(f'Error: {e}')
        return error_response(str(e), 500)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def success_response(data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data),
        'isBase64Encoded': False
    }


def error_response(message: str, code: int) -> dict:
    return {
        'statusCode': code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
