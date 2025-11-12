#!/usr/bin/env python3
"""
Fetch the complete ResultsStep.tsx file from the chunked API
and save it to ResultsStep.original.tsx
"""

import requests
import json

def fetch_all_chunks():
    base_url = 'https://functions.poehali.dev/7f65b331-870f-4c66-97be-92631d0c8200'
    chunk_size = 10000
    all_content = ''
    chunk_num = 0
    has_more = True

    print('Fetching file from git commit 1e84b6d...\n')

    while has_more:
        url = f'{base_url}?chunk={chunk_num}&size={chunk_size}'
        print(f'Fetching chunk {chunk_num}...')
        
        response = requests.get(url)
        data = response.json()
        
        all_content += data['chunk']
        has_more = data['has_more']
        
        print(f'  Chunk {chunk_num}: {data["start"]}-{data["end"]} / {data["total_length"]} bytes')
        print(f'  Has more: {has_more}')
        
        chunk_num += 1
        
        if chunk_num > 10:
            print('Safety limit reached')
            break

    print(f'\nTotal content length: {len(all_content)} characters')
    return all_content

def main():
    try:
        content = fetch_all_chunks()
        
        # Save to file
        with open('ResultsStep.original.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print('\n✅ File saved as: ResultsStep.original.tsx')
        
        # Print first and last 500 chars for verification
        print('\n=== First 500 characters ===')
        print(content[:500])
        print('\n=== Last 500 characters ===')
        print(content[-500:])
        
    except Exception as e:
        print(f'Error: {e}')
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
