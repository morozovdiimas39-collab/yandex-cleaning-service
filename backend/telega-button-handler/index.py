import json
import os
import psycopg2
import requests

def handler(event: dict, context) -> dict:
    '''
    Обработка нажатий кнопок в Telegram (callback_query)
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
    
    # Telegram отправляет callback_query
    callback_query = body.get('callback_query')
    if not callback_query:
        # Игнорируем не-callback события
        return success_response({'ok': True})
    
    callback_data = callback_query.get('data', '')
    callback_id = callback_query.get('id')
    message = callback_query.get('message', {})
    chat_id = message.get('chat', {}).get('id')
    message_id = message.get('message_id')
    
    # Парсим callback_data: "status:lead_id:new_status"
    parts = callback_data.split(':')
    if len(parts) != 3 or parts[0] != 'status':
        return error_response('Invalid callback_data', 400)
    
    _, lead_id, new_status = parts
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('DATABASE_URL not configured', 500)
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Получаем данные лида и проекта
        cur.execute('''
            SELECT l.id, l.phone, l.name, l.course, p.bot_token, p.metrika_counter_id
            FROM telega_crm_leads l
            JOIN telega_crm_projects p ON l.project_id = p.id
            WHERE l.id = %s
        ''', (lead_id,))
        
        row = cur.fetchone()
        if not row:
            return error_response('Lead not found', 404)
        
        lead_id, phone, name, course, bot_token, metrika_counter_id = row
        
        # Обновляем статус в БД
        cur.execute('''
            UPDATE telega_crm_leads
            SET status = %s, updated_at = NOW()
            WHERE id = %s
        ''', (new_status, lead_id))
        
        # Мапинг статусов на эмодзи и текст
        status_map = {
            'called': '☎️ Позвонил клиенту',
            'trial': '✅ Записался на пробное',
            'enrolled': '📝 Записался на обучение',
            'thinking': '🤔 Думает',
            'rejected': '❌ Нецелевой'
        }
        
        status_text = status_map.get(new_status, new_status)
        
        # Обновляем сообщение (убираем кнопки, добавляем статус)
        updated_text = f"🔔 <b>ЗАЯВКА</b>\\n\\n"
        updated_text += f"📞 Телефон: {phone}\\n"
        if name:
            updated_text += f"👤 Имя: {name}\\n"
        if course:
            updated_text += f"🎓 Курс: {course}\\n"
        updated_text += f"\\n<b>Статус:</b> {status_text}"
        
        # Отправляем answer на callback (убирает индикатор загрузки)
        telegram_answer_url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
        requests.post(telegram_answer_url, json={
            'callback_query_id': callback_id,
            'text': f'Статус обновлён: {status_text}'
        }, timeout=5)
        
        # Редактируем сообщение (убираем кнопки)
        telegram_edit_url = f'https://api.telegram.org/bot{bot_token}/editMessageText'
        requests.post(telegram_edit_url, json={
            'chat_id': chat_id,
            'message_id': message_id,
            'text': updated_text,
            'parse_mode': 'HTML'
        }, timeout=5)
        
        # Отправляем конверсию в Яндекс.Метрику
        if metrika_counter_id and new_status in ['trial', 'enrolled']:
            send_metrika_conversion(metrika_counter_id, new_status, phone)
        
        return success_response({'success': True})
        
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


def send_metrika_conversion(counter_id: str, status: str, phone: str) -> None:
    '''
    Отправка конверсии в Яндекс.Метрику через Measurement Protocol
    '''
    print(f'[METRIKA] Starting conversion send: counter={counter_id}, status={status}, phone={phone}')
    try:
        # Генерируем client_id из телефона (уникальный идентификатор)
        import hashlib
        client_id = hashlib.md5(phone.encode()).hexdigest()
        print(f'[METRIKA] Generated client_id: {client_id}')
        
        # Название цели в зависимости от статуса
        goal_name = 'trial_booking' if status == 'trial' else 'course_enrollment'
        print(f'[METRIKA] Goal name: {goal_name}')
        
        # URL для отправки конверсии
        metrika_url = f'https://mc.yandex.ru/watch/{counter_id}'
        
        params = {
            'browser-info': f'ar:1:pv:1:ls:1:en:utf-8',
            'page-url': f'https://telega-crm.conversion/{goal_name}',
            'page-ref': 'https://telega-crm.conversion/',
            'uid': client_id,
            'ut': 'noindex'
        }
        
        print(f'[METRIKA] Sending GET to {metrika_url} with params: {params}')
        response = requests.get(metrika_url, params=params, timeout=5)
        print(f'[METRIKA] SUCCESS! Status: {response.status_code}, Body: {response.text[:200]}')
    except Exception as e:
        print(f'[METRIKA] FAILED: {e}')