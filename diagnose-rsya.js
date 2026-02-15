// Diagnostic script for rsya-scheduler AccessDeniedException issue
// Usage: node diagnose-rsya.js

const https = require('https');

const CHECK_YC_URL = 'https://functions.yandexcloud.net/d4eq1q9g6hlg5q4n4t6p';

console.log('🔍 Diagnosing rsya-scheduler AccessDeniedException issue...\n');

https.get(CHECK_YC_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            
            console.log('📋 FULL DIAGNOSTIC REPORT:');
            console.log('='.repeat(80));
            console.log(JSON.stringify(result, null, 2));
            console.log('='.repeat(80));
            console.log('\n');
            
            // Analysis
            console.log('📊 ANALYSIS:');
            console.log('-'.repeat(80));
            
            // Check scheduler function
            if (result.functions && result.functions.scheduler) {
                const scheduler = result.functions.scheduler;
                console.log('\n✓ Scheduler Function:');
                console.log(`  - Status: ${scheduler.status}`);
                console.log(`  - ID: ${scheduler.id}`);
                
                if (scheduler.details) {
                    console.log(`  - Service Account: ${scheduler.details.service_account_id}`);
                    console.log(`  - Runtime: ${scheduler.details.runtime}`);
                }
            }
            
            // Check service account
            if (result.service_account) {
                const sa = result.service_account;
                console.log('\n✓ Service Account:');
                console.log(`  - Name: ${sa.name}`);
                console.log(`  - ID: ${sa.id}`);
                console.log(`  - Folder: ${sa.folder_id}`);
                console.log(`  - Roles: ${sa.roles ? sa.roles.join(', ') : 'NONE!'}`);
                
                if (!sa.roles || sa.roles.length === 0) {
                    console.log('\n⚠️  WARNING: No roles assigned to service account!');
                    console.log('   This is causing the AccessDeniedException.');
                    console.log('\n📝 SOLUTION:');
                    console.log('   Assign the following role to service account:');
                    console.log('   - ymq.writer (for Message Queue write access)');
                }
                
                if (sa.roles && !sa.roles.includes('ymq.writer')) {
                    console.log('\n⚠️  WARNING: Service account is missing ymq.writer role!');
                    console.log('   Add this role to fix AccessDeniedException.');
                }
            } else if (result.service_account_error) {
                console.log('\n❌ Service Account Error:');
                console.log(`   ${result.service_account_error}`);
            }
            
            // Check Message Queue
            if (result.message_queue) {
                console.log('\n✓ Message Queue:');
                console.log(`  - Queue URL: ${result.message_queue.queue_url}`);
                console.log(`  - Messages Available: ${result.message_queue.messages_available}`);
                console.log(`  - Messages In Flight: ${result.message_queue.messages_in_flight}`);
                console.log(`  - Access Key: ${result.message_queue.access_key_id}`);
            } else if (result.message_queue_error) {
                console.log('\n❌ Message Queue Error:');
                console.log(`   ${result.message_queue_error}`);
                
                if (result.message_queue_error.includes('AccessDeniedException')) {
                    console.log('\n🔧 This confirms the AccessDeniedException issue!');
                }
            }
            
            // Check triggers
            if (result.triggers) {
                console.log('\n✓ Triggers:');
                console.log(`  - Total: ${result.triggers.total}`);
                console.log(`  - CRON for Scheduler: ${result.triggers.cron_for_scheduler ? 'Configured' : 'NOT CONFIGURED'}`);
                console.log(`  - MQ for Worker: ${result.triggers.mq_for_worker ? 'Configured' : 'NOT CONFIGURED'}`);
                
                if (!result.triggers.cron_for_scheduler) {
                    console.log('\n⚠️  WARNING: No CRON trigger configured for rsya-scheduler!');
                    console.log('   The scheduler won\'t run automatically.');
                }
            }
            
            console.log('\n' + '='.repeat(80));
            console.log('\n✅ Diagnosis complete!');
            
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            console.error('Raw response:', data);
        }
    });
    
}).on('error', (error) => {
    console.error('❌ Error fetching diagnostic data:', error.message);
});
