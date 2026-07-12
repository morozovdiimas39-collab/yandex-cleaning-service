import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import psycopg2
from psycopg2.extras import RealDictCursor, Json


SCHEMA = 't_p97630513_yandex_cleaning_serv'
SESSION_HOURS = 8
PASSWORD_ITERATIONS = 310000
MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15


def response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
        },
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def get_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise RuntimeError('DATABASE_URL not configured')
    return psycopg2.connect(dsn, connect_timeout=5, cursor_factory=RealDictCursor)


def get_request_meta(event: Dict[str, Any]):
    headers = event.get('headers') or {}
    forwarded = headers.get('x-forwarded-for') or headers.get('X-Forwarded-For') or ''
    ip_address = forwarded.split(',')[0].strip()[:64] or None
    user_agent = (headers.get('user-agent') or headers.get('User-Agent') or '')[:500] or None
    return ip_address, user_agent


def get_bearer_token(event: Dict[str, Any]) -> Optional[str]:
    headers = event.get('headers') or {}
    authorization = headers.get('authorization') or headers.get('Authorization') or ''
    if not authorization.lower().startswith('bearer '):
        return None
    token = authorization[7:].strip()
    return token if len(token) >= 32 else None


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def hash_password(password: str, salt_hex: str, iterations: int) -> str:
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        bytes.fromhex(salt_hex),
        iterations,
        dklen=32,
    ).hex()


def password_is_strong(password: str) -> bool:
    return (
        len(password) >= 12
        and any(char.islower() for char in password)
        and any(char.isupper() for char in password)
        and any(char.isdigit() for char in password)
    )


def audit(cur, admin_user_id, username, event_type, success, ip_address, user_agent, details=None):
    cur.execute(f"""
        INSERT INTO {SCHEMA}.admin_auth_audit
            (admin_user_id, username, event_type, success, ip_address, user_agent, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        admin_user_id,
        username,
        event_type,
        success,
        ip_address,
        user_agent,
        Json(details or {}),
    ))


def load_session(cur, token: str):
    cur.execute(f"""
        SELECT s.id as session_id, s.admin_user_id, s.expires_at,
               u.username, u.is_active, u.must_change_password
        FROM {SCHEMA}.admin_sessions s
        JOIN {SCHEMA}.admin_users u ON u.id = s.admin_user_id
        WHERE s.token_hash = %s
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
          AND u.is_active = TRUE
        LIMIT 1
    """, (hash_token(token),))
    return cur.fetchone()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if event.get('httpMethod') == 'OPTIONS':
        return response(200, {})
    if event.get('httpMethod', 'POST') != 'POST':
        return response(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return response(400, {'error': 'Invalid JSON body'})

    action = str(body.get('action') or '').strip().lower()
    ip_address, user_agent = get_request_meta(event)
    print(f'admin-auth action={action or "-"}')

    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor()

        if action == 'login':
            username = str(body.get('username') or '').strip().lower()[:100]
            password = str(body.get('password') or '')
            if not username or not password:
                return response(400, {'error': 'Логин и пароль обязательны'})

            cur.execute(f"""
                SELECT id, username, password_salt, password_hash, password_iterations,
                       is_active, must_change_password, failed_attempts, locked_until
                FROM {SCHEMA}.admin_users
                WHERE username = %s
                FOR UPDATE
            """, (username,))
            admin = cur.fetchone()

            if admin and admin['locked_until'] and admin['locked_until'] > datetime.now():
                audit(cur, admin['id'], username, 'login_locked', False, ip_address, user_agent)
                conn.commit()
                return response(429, {'error': 'Слишком много попыток. Попробуйте позже.'})

            valid = bool(admin and admin['is_active'])
            if valid:
                supplied_hash = hash_password(password, admin['password_salt'], admin['password_iterations'])
                valid = hmac.compare_digest(supplied_hash, admin['password_hash'])

            if not valid:
                if admin:
                    attempts = int(admin['failed_attempts'] or 0) + 1
                    locked_until = datetime.now() + timedelta(minutes=LOCK_MINUTES) if attempts >= MAX_FAILED_ATTEMPTS else None
                    cur.execute(f"""
                        UPDATE {SCHEMA}.admin_users
                        SET failed_attempts = %s, locked_until = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (attempts, locked_until, admin['id']))
                audit(cur, admin['id'] if admin else None, username, 'login_failed', False, ip_address, user_agent)
                conn.commit()
                return response(401, {'error': 'Неверный логин или пароль'})

            token = secrets.token_urlsafe(48)
            expires_at = datetime.now() + timedelta(hours=SESSION_HOURS)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.admin_sessions
                    (admin_user_id, token_hash, expires_at, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s)
            """, (admin['id'], hash_token(token), expires_at, ip_address, user_agent))
            cur.execute(f"""
                UPDATE {SCHEMA}.admin_users
                SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW()
                WHERE id = %s
            """, (admin['id'],))
            audit(cur, admin['id'], username, 'login_success', True, ip_address, user_agent)
            conn.commit()
            return response(200, {
                'success': True,
                'token': token,
                'expires_at': expires_at.isoformat(),
                'username': admin['username'],
                'must_change_password': bool(admin['must_change_password']),
            })

        token = get_bearer_token(event) or str(body.get('session_token') or '').strip()
        if not token:
            return response(401, {'error': 'Unauthorized'})

        session = load_session(cur, token)
        if not session:
            return response(401, {'error': 'Session expired'})

        if action == 'verify':
            cur.execute(f"""
                UPDATE {SCHEMA}.admin_sessions
                SET last_seen_at = NOW()
                WHERE id = %s AND last_seen_at < NOW() - INTERVAL '5 minutes'
            """, (session['session_id'],))
            conn.commit()
            return response(200, {
                'authenticated': True,
                'username': session['username'],
                'expires_at': session['expires_at'].isoformat(),
                'must_change_password': bool(session['must_change_password']),
            })

        if action == 'change_password':
            current_password = str(body.get('current_password') or '')
            new_password = str(body.get('new_password') or '')
            if not password_is_strong(new_password):
                return response(400, {'error': 'Новый пароль: минимум 12 символов, заглавная и строчная буквы, цифра.'})

            cur.execute(f"""
                SELECT password_salt, password_hash, password_iterations
                FROM {SCHEMA}.admin_users WHERE id = %s FOR UPDATE
            """, (session['admin_user_id'],))
            admin = cur.fetchone()
            supplied_hash = hash_password(current_password, admin['password_salt'], admin['password_iterations'])
            if not hmac.compare_digest(supplied_hash, admin['password_hash']):
                audit(cur, session['admin_user_id'], session['username'], 'password_change_failed', False, ip_address, user_agent)
                conn.commit()
                return response(401, {'error': 'Текущий пароль неверен'})

            new_salt = secrets.token_hex(16)
            new_hash = hash_password(new_password, new_salt, PASSWORD_ITERATIONS)
            cur.execute(f"""
                UPDATE {SCHEMA}.admin_users
                SET password_salt = %s, password_hash = %s, password_iterations = %s,
                    must_change_password = FALSE, password_changed_at = NOW(), updated_at = NOW()
                WHERE id = %s
            """, (new_salt, new_hash, PASSWORD_ITERATIONS, session['admin_user_id']))
            cur.execute(f"""
                UPDATE {SCHEMA}.admin_sessions
                SET revoked_at = NOW()
                WHERE admin_user_id = %s AND id <> %s AND revoked_at IS NULL
            """, (session['admin_user_id'], session['session_id']))
            audit(cur, session['admin_user_id'], session['username'], 'password_changed', True, ip_address, user_agent)
            conn.commit()
            return response(200, {'success': True})

        if action == 'logout':
            cur.execute(f"""
                UPDATE {SCHEMA}.admin_sessions SET revoked_at = NOW() WHERE id = %s
            """, (session['session_id'],))
            audit(cur, session['admin_user_id'], session['username'], 'logout', True, ip_address, user_agent)
            conn.commit()
            return response(200, {'success': True})

        return response(400, {'error': 'Unknown action'})
    except Exception as exc:
        try:
            conn.rollback()
        except Exception:
            pass
        return response(500, {'error': 'Internal server error'})
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass
