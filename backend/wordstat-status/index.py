import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проверка статуса задачи Wordstat по task_id
    Args: event - dict с httpMethod (GET), queryStringParameters с task_id
          context - объект с атрибутами request_id
    Returns: HTTP response со статусом задачи (pending/processing/completed/failed), progress, result
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    task_id = query_params.get('task_id')
    
    if not task_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'task_id required'}),
            'isBase64Encoded': False
        }
    
    headers_dict = event.get('headers') or {}
    user_id = headers_dict.get('x-user-id') or headers_dict.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT id, status, progress, result, error, created_at, updated_at FROM wordstat_tasks WHERE id = %s AND user_id = %s",
            (int(task_id), user_id)
        )
        task = cur.fetchone()
        
        if not task:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Task not found'}),
                'isBase64Encoded': False
            }
        
        response_data = {
            'task_id': task['id'],
            'status': task['status'],
            'progress': task['progress'],
            'created_at': task['created_at'].isoformat() if task['created_at'] else None,
            'updated_at': task['updated_at'].isoformat() if task['updated_at'] else None
        }
        
        if task['status'] == 'completed' and task['result']:
            result_data = json.loads(task['result']) if isinstance(task['result'], str) else task['result']
            response_data['result'] = result_data
        
        if task['status'] == 'failed' and task['error']:
            response_data['error'] = task['error']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to fetch task status: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
