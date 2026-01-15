import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''
    Обработка команды /start от бота → сохраняем telegram_id пользователя
    '''
    method = event.get('httpMethod', 'POST')
    
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
    
    # Парсим Telegram update
    message = body.get('message', {})
    chat = message.get('chat', {})
    telegram_id = chat.get('id')
    text = message.get('text', '')
    
    if not telegram_id:
        return success_response({'ok': True})
    
    # Если команда /start - сохраняем telegram_id
    if not text.startswith('/start'):
        return success_response({'ok': True})
    
    # Парсим параметр: /start user_id_123
    parts = text.split('_')
    if len(parts) < 3:
        # Нет параметра - отправляем инструкцию
        return success_response({
            'ok': True,
            'message': 'Используйте ссылку из личного кабинета для привязки аккаунта'
        })
    
    try:
        user_id = int(parts[2])
    except:
        return success_response({'ok': True})
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Сохраняем telegram_id пользователя
        cur.execute('''
            UPDATE t_p97630513_yandex_cleaning_serv.users
            SET telegram_id = %s
            WHERE id = %s
        ''', (telegram_id, user_id))
        
        if cur.rowcount == 0:
            return error_response('User not found', 404)
        
        return success_response({
            'success': True,
            'message': 'Telegram аккаунт успешно привязан!'
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
