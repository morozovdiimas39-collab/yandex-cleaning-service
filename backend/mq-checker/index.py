import json
import os
import boto3
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проверка Message Queue - сколько сообщений в очереди
    Returns: Количество сообщений в rsyacleaner
    '''
    queue_url = 'https://message-queue.api.cloud.yandex.net/b1gtcrip05he61994ldo/dj600000007lh09q06il/rsyacleaner'
    access_key = os.environ.get('YANDEX_MQ_ACCESS_KEY_ID')
    secret_key = os.environ.get('YANDEX_MQ_SECRET_KEY')
    
    if not access_key or not secret_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'MQ credentials not configured'})
        }
    
    try:
        sqs = boto3.client(
            'sqs',
            endpoint_url='https://message-queue.api.cloud.yandex.net',
            region_name='ru-central1',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
        
        # Получаем атрибуты очереди
        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
        )
        
        attrs = response.get('Attributes', {})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'queue': 'rsyacleaner',
                'messages_available': int(attrs.get('ApproximateNumberOfMessages', 0)),
                'messages_in_flight': int(attrs.get('ApproximateNumberOfMessagesNotVisible', 0))
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
