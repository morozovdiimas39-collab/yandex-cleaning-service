import requests
import base64
import json

def handler(event, context):
    try:
        # Fetch the file content from GitHub API
        api_url = 'https://api.github.com/repos/morozovdiimas39-collab/yandex-cleaning-service/git/blobs/2c745976ccab2f75e4af7f286f9adf9437ce055b'
        
        response = requests.get(api_url, headers={
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitFileExtractor'
        })
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'GitHub API error: {response.status_code}'})
            }
        
        data = response.json()
        
        # Decode base64 content
        base64_content = data['content'].replace('\n', '')
        decoded_content = base64.b64decode(base64_content).decode('utf-8')
        
        # Save to file
        output_path = '/tmp/ResultsStep.original.tsx'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(decoded_content)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            'body': decoded_content
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
