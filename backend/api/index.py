import json
import os
import random
import secrets
import smtplib
import ssl
import psycopg2
from email.message import EmailMessage
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Схема БД в Yandex Cloud (таблицы из V0058 и др.)
SCHEMA = 't_p97630513_yandex_cleaning_serv'
LEAD_EMAIL = 'morozov.diimas39@yandex.ru'
YANDEX_SMTP_LOGIN = 'morozov.diimas39'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Единый API для авторизации и управления проектами кластеризации v2
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    query_params = event.get('queryStringParameters') or {}
    endpoint = query_params.get('endpoint', '')

    if endpoint == 'landing-lead':
        return handle_landing_lead(event)
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }

    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        cur = conn.cursor()

        if endpoint == 'auth':
            return handle_auth(event, cur, conn)
        elif endpoint == 'verify':
            return handle_verify(event, cur, conn)
        elif endpoint == 'projects':
            return handle_projects(event, cur, conn)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid endpoint'})
            }
    except Exception as e:
        import traceback
        err_msg = str(e)
        err_tb = traceback.format_exc()
        print(f'API error: {err_msg}\n{err_tb}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error', 'detail': err_msg})
        }
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def response_json(status_code: int, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False)
    }

def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body_raw = event.get('body')
    if body_raw is None:
        return {}
    if isinstance(body_raw, bytes):
        body_raw = body_raw.decode('utf-8', errors='replace')
    if not str(body_raw).strip():
        return {}
    try:
        return json.loads(body_raw)
    except json.JSONDecodeError:
        return {}

def handle_landing_lead(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method != 'POST':
        return response_json(405, {'error': 'Method not allowed'})

    body = parse_json_body(event)
    phone = str(body.get('phone') or '').strip()
    source = str(body.get('source') or '').strip()

    if len(phone) < 7:
        return response_json(400, {'error': 'Укажите телефон'})

    smtp_host = os.environ.get('SMTP_HOST', 'smtp.yandex.ru')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER', YANDEX_SMTP_LOGIN)
    smtp_password = os.environ.get('SMTP_PASSWORD')
    smtp_from = os.environ.get('SMTP_FROM', LEAD_EMAIL)
    lead_email_to = os.environ.get('LEAD_EMAIL_TO', LEAD_EMAIL)

    if not smtp_password:
        return response_json(503, {
            'error': 'Email delivery is not configured',
            'detail': 'Set SMTP_PASSWORD'
        })

    message = EmailMessage()
    message['Subject'] = 'Заявка на закрытый бета-тест DirectKit РСЯ'
    message['From'] = smtp_from
    message['To'] = lead_email_to
    message.set_content(
        '\n'.join([
            'Новая заявка на закрытый бета-тест DirectKit РСЯ',
            '',
            f'Телефон: {phone}',
            f'Страница: {source or "-"}',
            f'Дата: {datetime.now().isoformat(timespec="seconds")}'
        ])
    )

    try:
        use_starttls = os.environ.get('SMTP_USE_STARTTLS', '').lower() in ('1', 'true', 'yes')
        if use_starttls:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                smtp.login(smtp_user, smtp_password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ssl.create_default_context(), timeout=10) as smtp:
                smtp.login(smtp_user, smtp_password)
                smtp.send_message(message)
    except Exception as exc:
        print(f'Landing lead email error: {exc}')
        return response_json(502, {'error': 'Не удалось отправить заявку'})

    return response_json(200, {'success': True})

def handle_auth(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_raw = event.get('body')
    if body_raw is None:
        body_raw = '{}'
    if isinstance(body_raw, bytes):
        body_raw = body_raw.decode('utf-8', errors='replace')
    if not (body_raw and body_raw.strip()):
        body_raw = '{}'
    try:
        body_data = json.loads(body_raw)
    except json.JSONDecodeError:
        body_data = {}
    action = body_data.get('action')
    
    if action == 'send_code':
        phone = body_data.get('phone', '').strip()
        if not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone is required'})
            }
        
        code = str(random.randint(1000, 9999))
        expires_at = datetime.now() + timedelta(minutes=10)
        
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        user = cur.fetchone()

        if user:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET verification_code = %s, code_expires_at = %s WHERE phone = %s",
                (code, expires_at, phone)
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (phone, verification_code, code_expires_at) VALUES (%s, %s, %s)",
                (phone, code, expires_at)
            )
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Код отправлен', 'code': code})
        }
    
    elif action == 'verify_code':
        phone = body_data.get('phone', '').strip()
        code = body_data.get('code', '').strip()
        
        if not phone or not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone and code are required'})
            }
        
        cur.execute(
            f"SELECT id, verification_code, code_expires_at FROM {SCHEMA}.users WHERE phone = %s",
            (phone,)
        )
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        user_id, stored_code, expires_at = user
        
        if stored_code != code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid verification code'})
            }
        
        if datetime.now() > expires_at:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Verification code expired'})
            }
        
        session_token = secrets.token_hex(32)
        token_expires = datetime.now() + timedelta(days=30)
        
        cur.execute(
            f"UPDATE {SCHEMA}.users SET is_verified = TRUE, last_login_at = %s, session_token = %s, token_expires_at = %s WHERE id = %s",
            (datetime.now(), session_token, token_expires, user_id)
        )
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'userId': user_id, 'phone': phone, 'sessionToken': session_token})
        }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'})
    }

def handle_verify(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    '''Проверяет валидность токена сессии'''
    method = event.get('httpMethod', 'GET')
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'valid': False, 'error': 'No token provided'})
        }
    
    user_id = verify_session(cur, session_token)
    
    if user_id:
        cur.execute(f"SELECT phone FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        result = cur.fetchone()
        phone = result[0] if result else None
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'valid': True, 'userId': user_id, 'phone': phone})
        }
    else:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'valid': False, 'error': 'Invalid or expired token'})
        }

def verify_session(cur, session_token: str) -> Optional[int]:
    '''Проверяет токен сессии и возвращает user_id или None'''
    if not session_token:
        return None
    
    cur.execute(
        f"SELECT id, token_expires_at FROM {SCHEMA}.users WHERE session_token = %s",
        (session_token,)
    )
    result = cur.fetchone()
    
    if not result:
        return None
    
    user_id, expires_at = result
    
    if expires_at and datetime.now() > expires_at:
        return None
    
    return user_id

def handle_projects(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
    
    user_id = verify_session(cur, session_token)
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid or expired session'})
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        project_id = query_params.get('id')
        
        if project_id:
            try:
                user_id_int = int(user_id)
            except (ValueError, TypeError):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid user ID'})
                }
            
            cur.execute(
                f"""
                SELECT id, name, keywords_count, clusters_count, minus_words_count,
                       created_at, updated_at, results, user_id
                FROM {SCHEMA}.clustering_projects
                WHERE id = %s
                """,
                (project_id,)
            )
            result = cur.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Project not found'})
                }
            
            project_owner_id = result[8]
            if project_owner_id != user_id_int:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Access denied: not your project'})
                }
            
            project = {
                'id': result[0],
                'name': result[1],
                'keywordsCount': result[2],
                'clustersCount': result[3],
                'minusWordsCount': result[4],
                'createdAt': result[5].isoformat() if result[5] else None,
                'updatedAt': result[6].isoformat() if result[6] else None,
                'results': result[7]
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(project)
            }
        else:
            cur.execute(
                f"""
                SELECT id, name, source, website_url,
                       keywords_count, clusters_count, minus_words_count,
                       created_at, updated_at
                FROM {SCHEMA}.clustering_projects
                WHERE user_id = %s
                ORDER BY updated_at DESC
                """,
                (user_id,)
            )
            projects = []
            for row in cur.fetchall():
                projects.append({
                    'id': row[0],
                    'name': row[1],
                    'domain': row[3],
                    'keywordsCount': row[4],
                    'clustersCount': row[5],
                    'minusWordsCount': row[6],
                    'createdAt': row[7].isoformat() if row[7] else None,
                    'updatedAt': row[8].isoformat() if row[8] else None,
                    'status': row[2]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'projects': projects})
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '')
        domain = body_data.get('domain', '')
        intent_filter = body_data.get('intentFilter', 'all')
        
        if not name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Project name is required'})
            }
        
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.clustering_projects (user_id, name)
            VALUES (%s, %s)
            RETURNING id, created_at, updated_at
            """,
            (user_id, name)
        )
        result = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': result[0],
                'name': name,
                'keywordsCount': 0,
                'clustersCount': 0,
                'minusWordsCount': 0,
                'createdAt': result[1].isoformat(),
                'updatedAt': result[2].isoformat()
            })
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        project_id = body_data.get('id')
        
        if not project_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Project ID is required'})
            }
        
        cur.execute(f"SELECT id FROM {SCHEMA}.clustering_projects WHERE id = %s AND user_id = %s", (project_id, user_id))
        if not cur.fetchone():
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Project not found'})
            }
        
        update_fields = []
        update_values = []
        
        if 'name' in body_data:
            update_fields.append('name = %s')
            update_values.append(body_data['name'])
        if 'keywordsCount' in body_data:
            update_fields.append('keywords_count = %s')
            update_values.append(body_data['keywordsCount'])
        if 'clustersCount' in body_data:
            update_fields.append('clusters_count = %s')
            update_values.append(body_data['clustersCount'])
        if 'minusWordsCount' in body_data:
            update_fields.append('minus_words_count = %s')
            update_values.append(body_data['minusWordsCount'])
        if 'results' in body_data:
            update_fields.append('results = %s')
            update_values.append(json.dumps(body_data['results']))
        
        update_fields.append('updated_at = %s')
        update_values.append(datetime.now())
        update_values.append(project_id)
        update_values.append(user_id)
        
        cur.execute(
            f"UPDATE {SCHEMA}.clustering_projects SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s",
            update_values
        )
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    elif method == 'DELETE':
        query_params = event.get('queryStringParameters') or {}
        project_id = query_params.get('id')
        
        if not project_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Project ID is required'})
            }
        
        cur.execute(f"DELETE FROM {SCHEMA}.clustering_projects WHERE id = %s AND user_id = %s", (project_id, user_id))
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Project not found'})
            }
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
