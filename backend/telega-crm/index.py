import json
import os
import psycopg2
import requests
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''
    API для управления проектами TelegaCRM и приёма заявок с сайта
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        if method == 'GET':
            return get_projects(cur, event)
        elif method == 'POST':
            return create_project(cur, event)
        elif method == 'PUT':
            return update_project(cur, event)
        elif method == 'DELETE':
            return delete_project(cur, event)
        else:
            return error_response('Method not allowed', 405)
            
    except Exception as e:
        print(f'Error: {e}')
        return error_response(str(e), 500)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def get_projects(cur, event: dict) -> dict:
    '''Получить список проектов пользователя'''
    params = event.get('queryStringParameters') or {}
    user_id = params.get('user_id')
    
    if not user_id:
        return error_response('user_id required', 400)
    
    cur.execute('''
        SELECT id, name, bot_token, telegram_chat_id, metrika_counter_id, yandex_metrika_token, created_at, updated_at
        FROM telega_crm_projects
        WHERE user_id = %s
        ORDER BY created_at DESC
    ''', (user_id,))
    
    projects = []
    for row in cur.fetchall():
        projects.append({
            'id': row[0],
            'name': row[1],
            'bot_token': row[2],
            'telegram_chat_id': row[3],
            'metrika_counter_id': row[4],
            'yandex_metrika_token': row[5],
            'created_at': row[6].isoformat() if row[6] else None,
            'updated_at': row[7].isoformat() if row[7] else None
        })
    
    return success_response({'projects': projects})


def create_project(cur, event: dict) -> dict:
    '''Создать новый проект'''
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return error_response('Invalid JSON', 400)
    
    user_id = body.get('user_id')
    name = body.get('name')
    bot_token = body.get('bot_token')
    telegram_chat_id = body.get('telegram_chat_id')  # Необязательное поле
    metrika_counter_id = body.get('metrika_counter_id')  # Необязательное поле
    
    if not all([user_id, name, bot_token]):
        return error_response('user_id, name, and bot_token required', 400)
    
    # Получаем telegram_id пользователя для owner_telegram_id
    cur.execute('SELECT telegram_id FROM t_p97630513_yandex_cleaning_serv.users WHERE id = %s', (user_id,))
    user_row = cur.fetchone()
    owner_telegram_id = user_row[0] if user_row else None
    
    cur.execute('''
        INSERT INTO telega_crm_projects (user_id, name, bot_token, telegram_chat_id, owner_telegram_id, metrika_counter_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    ''', (user_id, name, bot_token, telegram_chat_id or None, owner_telegram_id, metrika_counter_id or None))
    
    row = cur.fetchone()
    project_id = row[0]
    
    # Автоматически устанавливаем вебхук для /start команды
    start_handler_url = 'https://functions.poehali.dev/7a1ec7f5-f3c4-45d7-b0d7-4ab82a094653'
    try:
        webhook_response = requests.post(
            f'https://api.telegram.org/bot{bot_token}/setWebhook',
            json={'url': start_handler_url},
            timeout=5
        )
        webhook_data = webhook_response.json()
        if not webhook_data.get('ok'):
            print(f'Warning: Failed to set webhook: {webhook_data}')
    except Exception as e:
        print(f'Warning: Could not set webhook: {e}')
    
    return success_response({
        'id': project_id,
        'name': name,
        'bot_token': bot_token,
        'telegram_chat_id': telegram_chat_id,
        'created_at': row[1].isoformat() if row[1] else None
    })


def update_project(cur, event: dict) -> dict:
    '''Обновить проект'''
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return error_response('Invalid JSON', 400)
    
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    
    if not all([project_id, user_id]):
        return error_response('project_id and user_id required', 400)
    
    updates = []
    params = []
    
    if 'name' in body:
        updates.append('name = %s')
        params.append(body['name'])
    if 'bot_token' in body:
        updates.append('bot_token = %s')
        params.append(body['bot_token'])
    if 'telegram_chat_id' in body:
        updates.append('telegram_chat_id = %s')
        params.append(body['telegram_chat_id'])
    if 'metrika_counter_id' in body:
        updates.append('metrika_counter_id = %s')
        params.append(body['metrika_counter_id'])
    
    if not updates:
        return error_response('No fields to update', 400)
    
    updates.append('updated_at = NOW()')
    params.extend([project_id, user_id])
    
    cur.execute(f'''
        UPDATE telega_crm_projects
        SET {', '.join(updates)}
        WHERE id = %s AND user_id = %s
        RETURNING id
    ''', params)
    
    if cur.rowcount == 0:
        return error_response('Project not found', 404)
    
    return success_response({'success': True})


def delete_project(cur, event: dict) -> dict:
    '''Удалить проект'''
    params = event.get('queryStringParameters') or {}
    project_id = params.get('project_id')
    user_id = params.get('user_id')
    
    if not all([project_id, user_id]):
        return error_response('project_id and user_id required', 400)
    
    cur.execute('''
        DELETE FROM telega_crm_projects
        WHERE id = %s AND user_id = %s
        RETURNING id
    ''', (project_id, user_id))
    
    if cur.rowcount == 0:
        return error_response('Project not found', 404)
    
    return success_response({'success': True})


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