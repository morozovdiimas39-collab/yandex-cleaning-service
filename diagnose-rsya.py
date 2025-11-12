#!/usr/bin/env python3
"""
Diagnostic script for rsya-scheduler AccessDeniedException issue
Usage: python3 diagnose-rsya.py
"""

import json
import urllib.request
import sys

CHECK_YC_URL = 'https://functions.poehali.dev/56553e1a-0378-4b18-bea1-de65b7498d5d'

def main():
    print('🔍 Diagnosing rsya-scheduler AccessDeniedException issue...\n')
    
    try:
        with urllib.request.urlopen(CHECK_YC_URL) as response:
            data = json.loads(response.read().decode())
            
        print('📋 FULL DIAGNOSTIC REPORT:')
        print('=' * 80)
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print('=' * 80)
        print()
        
        # Analysis
        print('📊 ANALYSIS:')
        print('-' * 80)
        
        # Check scheduler function
        if 'functions' in data and 'scheduler' in data['functions']:
            scheduler = data['functions']['scheduler']
            print('\n✓ Scheduler Function:')
            print(f"  - Status: {scheduler.get('status')}")
            print(f"  - ID: {scheduler.get('id')}")
            
            if 'details' in scheduler and scheduler['details']:
                print(f"  - Service Account: {scheduler['details'].get('service_account_id')}")
                print(f"  - Runtime: {scheduler['details'].get('runtime')}")
        
        # Check service account
        if 'service_account' in data:
            sa = data['service_account']
            print('\n✓ Service Account:')
            print(f"  - Name: {sa.get('name')}")
            print(f"  - ID: {sa.get('id')}")
            print(f"  - Folder: {sa.get('folder_id')}")
            roles = sa.get('roles', [])
            print(f"  - Roles: {', '.join(roles) if roles else 'NONE!'}")
            
            if not roles:
                print('\n⚠️  WARNING: No roles assigned to service account!')
                print('   This is causing the AccessDeniedException.')
                print('\n📝 SOLUTION:')
                print('   Assign the following role to service account:')
                print('   - ymq.writer (for Message Queue write access)')
                print('\n   Command:')
                print(f"   yc resource-manager folder add-access-binding b1gfge7vvmv0dmokngu5 \\")
                print(f"     --role ymq.writer \\")
                print(f"     --service-account-id {sa.get('id')}")
            
            if roles and 'ymq.writer' not in roles:
                print('\n⚠️  WARNING: Service account is missing ymq.writer role!')
                print('   Add this role to fix AccessDeniedException.')
                print('\n   Current roles:', ', '.join(roles))
                print('\n   Command to add missing role:')
                print(f"   yc resource-manager folder add-access-binding b1gfge7vvmv0dmokngu5 \\")
                print(f"     --role ymq.writer \\")
                print(f"     --service-account-id {sa.get('id')}")
        elif 'service_account_error' in data:
            print('\n❌ Service Account Error:')
            print(f"   {data['service_account_error']}")
        
        # Check Message Queue
        if 'message_queue' in data:
            mq = data['message_queue']
            print('\n✓ Message Queue:')
            print(f"  - Queue URL: {mq.get('queue_url')}")
            print(f"  - Messages Available: {mq.get('messages_available')}")
            print(f"  - Messages In Flight: {mq.get('messages_in_flight')}")
            if 'access_key_id' in mq:
                print(f"  - Access Key: {mq.get('access_key_id')}")
        elif 'message_queue_error' in data:
            print('\n❌ Message Queue Error:')
            print(f"   {data['message_queue_error']}")
            
            if 'AccessDeniedException' in data['message_queue_error']:
                print('\n🔧 This confirms the AccessDeniedException issue!')
                print('   The service account needs proper permissions.')
        
        # Check triggers
        if 'triggers' in data:
            triggers = data['triggers']
            print('\n✓ Triggers:')
            print(f"  - Total: {triggers.get('total')}")
            
            cron = triggers.get('cron_for_scheduler')
            mq_trigger = triggers.get('mq_for_worker')
            
            print(f"  - CRON for Scheduler: {'Configured' if cron else 'NOT CONFIGURED'}")
            print(f"  - MQ for Worker: {'Configured' if mq_trigger else 'NOT CONFIGURED'}")
            
            if not cron:
                print('\n⚠️  WARNING: No CRON trigger configured for rsya-scheduler!')
                print('   The scheduler won\'t run automatically.')
                print('   Add this to your crontab or Yandex Cloud Triggers:')
                print('   0 * * * * curl -X GET https://functions.poehali.dev/e7523331-bd26-46dc-b5d0-984596fb7cc9')
        
        print('\n' + '=' * 80)
        print('\n✅ Diagnosis complete!')
        print('\n📄 For detailed fix instructions, see: RSYA_SCHEDULER_DIAGNOSIS.md')
        
    except urllib.error.HTTPError as e:
        print(f'❌ HTTP Error {e.code}: {e.reason}')
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f'❌ URL Error: {e.reason}')
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f'❌ JSON Decode Error: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'❌ Unexpected Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
