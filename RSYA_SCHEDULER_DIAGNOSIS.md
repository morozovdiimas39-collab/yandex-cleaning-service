# 🔍 RSYA Scheduler AccessDeniedException Diagnosis

## Problem Summary
The `rsya-scheduler` function (ID: `d4et4pke4rosupb0kahm`) is encountering `AccessDeniedException` when attempting to send messages to Yandex Message Queue.

## Diagnostic Results

Based on the check-yc function diagnostic report, here are the findings:

### ✅ Function Status
- **Function Name**: rsya-scheduler
- **Function ID**: d4et4pke4rosupb0kahm
- **Status**: ACTIVE
- **Runtime**: python311
- **Service Account ID**: ajeu18960pcbgb9khp4f

### ❌ Root Cause: Missing Service Account Permissions

The AccessDeniedException error occurs because:

1. **Service Account Configuration**: The rsya-scheduler function uses service account `ajeu18960pcbgb9khp4f`
2. **Missing Role**: This service account likely does NOT have the `ymq.writer` role assigned
3. **Required Permission**: To send messages to Yandex Message Queue, the service account must have write permissions

### 🔧 Solution

You need to assign the appropriate role to the service account. There are two options:

#### Option 1: Minimal Permissions (Recommended)
Assign only the necessary Message Queue write permission:
```bash
yc resource-manager folder add-access-binding b1gfge7vvmv0dmokngu5 \
  --role ymq.writer \
  --service-account-id ajeu18960pcbgb9khp4f
```

#### Option 2: Full Editor Access
Assign editor role (gives broader permissions):
```bash
yc resource-manager folder add-access-binding b1gfge7vvmv0dmokngu5 \
  --role editor \
  --service-account-id ajeu18960pcbgb9khp4f
```

### 📋 Verification Steps

After assigning the role, verify the fix:

1. **Check roles assigned**:
```bash
yc iam service-account list-access-bindings ajeu18960pcbgb9khp4f
```

2. **Test the scheduler function**:
```bash
curl -X GET https://functions.poehali.dev/e7523331-bd26-46dc-b5d0-984596fb7cc9
```

3. **Check Message Queue**:
Query the database to see if batches are being created:
```sql
SELECT COUNT(*), status 
FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

### 📊 Additional Findings

#### Message Queue Configuration
- **Queue URL**: `https://message-queue.api.cloud.yandex.net/b1gfge7vvmv0dmokngu5/dj600000007lh09q06il/rsyacleaner`
- **Access Method**: Using static access keys (YANDEX_MQ_ACCESS_KEY_ID / YANDEX_MQ_SECRET_KEY)
- **Current Status**: Also encountering AccessDeniedException

#### Triggers Status
- **Total Triggers**: 5
- **CRON Trigger for Scheduler**: ❌ NOT CONFIGURED
- **Message Queue Trigger for Worker**: ❌ NOT CONFIGURED

**Important**: After fixing the AccessDeniedException, you also need to configure:
1. A CRON trigger to invoke rsya-scheduler periodically
2. A Message Queue trigger to invoke rsya-batch-worker when messages arrive

### 🎯 Complete Setup Checklist

- [ ] **Step 1**: Assign `ymq.writer` role to service account `ajeu18960pcbgb9khp4f`
- [ ] **Step 2**: Verify the role assignment
- [ ] **Step 3**: Test manual scheduler invocation
- [ ] **Step 4**: Configure CRON trigger for rsya-scheduler (hourly)
- [ ] **Step 5**: Configure Message Queue trigger for rsya-batch-worker
- [ ] **Step 6**: Monitor batch processing in database

### 🔗 Related Documentation

- Message Queue Access Management: https://cloud.yandex.com/en/docs/message-queue/security/
- Service Account Roles: https://cloud.yandex.ru/docs/iam/concepts/access-control/roles
- CRON Trigger Setup: See `backend/BATCH_SYSTEM_SETUP.md`

### 📱 Contact Information

If you need to check the current diagnostic status, you can:

1. **Via Web Browser**: Open `diagnose-rsya-scheduler.html` in your project
2. **Via Node.js**: Run `node diagnose-rsya.js`
3. **Via API**: Call `https://functions.poehali.dev/56553e1a-0378-4b18-bea1-de65b7498d5d`

---

## Technical Details

### How rsya-scheduler Works

1. Scheduler runs (via CRON or manual trigger)
2. Queries database for projects scheduled to run
3. For each project:
   - Splits campaign_ids into batches of 14 campaigns
   - Creates batch records in `rsya_campaign_batches` table
   - **Attempts to send each batch to Message Queue** ← THIS FAILS with AccessDeniedException
4. Updates next_run_at timestamp

### The Error Location

The error occurs in `/backend/rsya-scheduler/index.py` at line 214:
```python
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps(message)
)
```

The boto3 SQS client uses the environment variables:
- `YANDEX_MQ_ACCESS_KEY_ID`
- `YANDEX_MQ_SECRET_KEY`

However, these static access keys are associated with a service account that lacks write permissions to the Message Queue.

### Alternative Solution

Instead of using static access keys, you could:
1. Remove the environment variables for MQ access keys
2. Ensure the function's service account (`ajeu18960pcbgb9khp4f`) has `ymq.writer` role
3. Update the code to use IAM token authentication instead of static keys

This would be more secure and follow Yandex Cloud best practices.
