import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Health check и мониторинг системы автоматизации РСЯ
    Args: event - dict с httpMethod
          context - объект с request_id
    Returns: HTTP response dict со статистикой и статусом системы
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Статистика по очереди блокировки
        cursor.execute("""
            SELECT 
                status,
                COUNT(*) as count,
                COUNT(DISTINCT project_id) as projects,
                COUNT(DISTINCT campaign_id) as campaigns
            FROM block_queue
            GROUP BY status
        """)
        queue_stats = cursor.fetchall()
        
        # Проекты с активными задачами
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM rsya_projects 
            WHERE yandex_token IS NOT NULL
        """)
        active_projects = cursor.fetchone()['count']
        
        # Активные задачи
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM rsya_tasks
            WHERE enabled = true
        """)
        active_tasks = cursor.fetchone()['count']
        
        # Площадки с высокими attempts (потенциальные проблемы)
        cursor.execute("""
            SELECT campaign_id, domain, attempts, error_message
            FROM block_queue
            WHERE attempts >= 2 AND status = 'pending'
            ORDER BY attempts DESC, cost DESC
            LIMIT 10
        """)
        problem_platforms = cursor.fetchall()
        
        # Статистика по последним 24 часам
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT campaign_id) as campaigns
            FROM block_queue
            WHERE created_at > NOW() - INTERVAL '24 hours'
        """)
        last_24h = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Формируем статус
        total_pending = sum(row['count'] for row in queue_stats if row['status'] == 'pending')
        total_failed = sum(row['count'] for row in queue_stats if row['status'] == 'failed')
        
        # Определяем health status
        health = 'healthy'
        warnings = []
        
        if total_pending > 5000:
            health = 'warning'
            warnings.append(f'High pending queue: {total_pending} platforms')
        
        if total_failed > 1000:
            health = 'warning'
            warnings.append(f'High failed count: {total_failed} platforms')
        
        if len(problem_platforms) > 5:
            health = 'warning'
            warnings.append(f'{len(problem_platforms)} platforms with multiple retry attempts')
        
        result = {
            'health': health,
            'timestamp': datetime.now().isoformat(),
            'warnings': warnings,
            'statistics': {
                'active_projects': active_projects,
                'active_tasks': active_tasks,
                'queue': {row['status']: row['count'] for row in queue_stats},
                'queue_by_status': [dict(row) for row in queue_stats],
                'last_24h': dict(last_24h),
                'problem_platforms': [dict(row) for row in problem_platforms]
            }
        }
        
        print(f'🏥 Health check: {health}, pending={total_pending}, failed={total_failed}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f'❌ Error in health check: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'health': 'error',
                'error': str(e)
            })
        }
