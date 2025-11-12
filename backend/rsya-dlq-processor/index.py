import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import boto3

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: DLQ processor для повторной обработки проблемных батчей
    Args: event - dict с httpMethod (CRON триггер или ручной запуск)
          context - объект с request_id
    Returns: HTTP response с количеством повторно обработанных батчей
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем failed батчи для повторной обработки
        cursor.execute("""
            SELECT 
                b.id as batch_id,
                b.project_id,
                b.campaign_ids,
                b.retry_count,
                b.max_retries,
                b.error_message,
                p.yandex_token
            FROM rsya_campaign_batches b
            JOIN rsya_projects p ON p.id = b.project_id
            WHERE b.status = 'failed'
              AND b.retry_count < b.max_retries
              AND b.created_at > NOW() - INTERVAL '24 hours'
            ORDER BY b.created_at DESC
            LIMIT 50
        """)
        
        failed_batches = cursor.fetchall()
        
        if not failed_batches:
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'No failed batches to retry',
                    'retried': 0
                })
            }
        
        # Повторно отправляем в Message Queue
        retried_count = 0
        for batch in failed_batches:
            try:
                # Отправляем в MQ
                send_to_mq({
                    'batch_id': batch['batch_id'],
                    'project_id': batch['project_id'],
                    'campaign_ids': batch['campaign_ids'],
                    'yandex_token': batch['yandex_token'],
                    'retry_attempt': batch['retry_count'] + 1
                })
                
                # Обновляем статус
                cursor.execute("""
                    UPDATE rsya_campaign_batches
                    SET status = 'pending',
                        retry_count = retry_count + 1,
                        error_message = NULL
                    WHERE id = %s
                """, (batch['batch_id'],))
                
                retried_count += 1
                
            except Exception as e:
                print(f"❌ Error retrying batch {batch['batch_id']}: {str(e)}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Retried {retried_count}/{len(failed_batches)} failed batches")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'total_failed': len(failed_batches),
                'retried': retried_count
            })
        }
        
    except Exception as e:
        print(f"❌ DLQ processor error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def send_to_mq(message: Dict[str, Any]) -> None:
    '''Отправка батча в Message Queue для повторной обработки'''
    # Используем существующую очередь rsyacleaner
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gtcrip05he61994ldo/dj600000007lh09q06il/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    if not access_key or not secret_key:
        raise Exception('Message Queue credentials not configured')
    
    sqs = boto3.client(
        'sqs',
        endpoint_url='https://message-queue.api.cloud.yandex.net',
        region_name='ru-central1',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )
    
    sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message)
    )
    
    print(f"📤 Retry batch {message['batch_id']} sent to MQ (attempt {message.get('retry_attempt', 1)})")