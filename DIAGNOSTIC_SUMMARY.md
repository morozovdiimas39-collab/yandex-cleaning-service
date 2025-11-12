# 🔍 RSYA Scheduler AccessDeniedException - Complete Diagnostic Report

## Executive Summary

The `rsya-scheduler` function is experiencing `AccessDeniedException` errors when attempting to send messages to Yandex Message Queue. The root cause is **insufficient permissions** on the service account used by the function.

---

## 📊 Diagnostic Information Collected

### Check-YC Function Output

I've enhanced and deployed the `check-yc` diagnostic function which now provides detailed information about:

1. **Function Configuration** - Including service account ID
2. **Service Account Details** - Name, ID, and assigned roles
3. **Message Queue Status** - Connection and access status
4. **Triggers Configuration** - CRON and MQ trigger status
5. **Permissions Analysis** - Role bindings on the folder level

**Diagnostic Function URL**: `https://functions.poehali.dev/56553e1a-0378-4b18-bea1-de65b7498d5d`

---

## 🔴 Root Cause Analysis

### The Problem

When `rsya-scheduler` tries to execute this code (line 214 in `backend/rsya-scheduler/index.py`):

```python
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps(message)
)
```

It encounters an `AccessDeniedException` from Yandex Message Queue.

### Why It Happens

The function uses boto3 with static access keys:
- `YANDEX_MQ_ACCESS_KEY_ID`
- `YANDEX_MQ_SECRET_KEY`

These access keys are tied to a service account that **lacks write permissions** to the Message Queue.

### Function Details

- **Function ID**: `d4et4pke4rosupb0kahm`
- **Function Name**: `rsya-scheduler`
- **Service Account ID**: `ajeu18960pcbgb9khp4f`
- **Runtime**: python311
- **Status**: ACTIVE

---

## ✅ Solution: Assign Required Permissions

### Step 1: Identify the Service Account

From the diagnostic output, the service account ID is: `ajeu18960pcbgb9khp4f`

### Step 2: Assign the Required Role

The service account needs the `ymq.writer` role to send messages to Message Queue.

**Using Yandex Cloud CLI**:

```bash
yc resource-manager folder add-access-binding b1gfge7vvmv0dmokngu5 \
  --role ymq.writer \
  --service-account-id ajeu18960pcbgb9khp4f
```

**Alternative: Using Yandex Cloud Console**:

1. Go to: https://console.cloud.yandex.ru/folders/b1gfge7vvmv0dmokngu5
2. Navigate to: IAM & Access Management → Service Accounts
3. Find the service account (ID: `ajeu18960pcbgb9khp4f`)
4. Click "Assign roles"
5. Add role: `ymq.writer`
6. Save

### Step 3: Verify the Role Assignment

```bash
yc iam service-account list-access-bindings ajeu18960pcbgb9khp4f
```

Expected output should include:
```
role_id: ymq.writer
```

---

## 🧪 Testing the Fix

### 1. Manual Scheduler Test

After assigning the role, test the scheduler:

```bash
curl -X GET https://functions.poehali.dev/e7523331-bd26-46dc-b5d0-984596fb7cc9
```

Expected response:
```json
{
  "success": true,
  "scheduled_projects": <number>,
  "total_batches": <number>,
  "results": [...]
}
```

### 2. Check Database for Batches

Query the database to confirm batches are being created:

```sql
SELECT 
    id,
    project_id,
    status,
    created_at,
    batch_number,
    total_batches
FROM t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

Expected: New rows with `status = 'pending'`

### 3. Re-run Diagnostic

Verify the fix by running the diagnostic again:

```bash
# Using Python
python3 diagnose-rsya.py

# Using Node.js
node diagnose-rsya.js

# Or via browser
# Open: diagnose-rsya-scheduler.html
```

---

## 🔧 Diagnostic Tools Provided

I've created three diagnostic tools you can use:

### 1. Python Script: `diagnose-rsya.py`

```bash
python3 diagnose-rsya.py
```

Outputs:
- Full JSON diagnostic report
- Analyzed findings with color-coded warnings
- Specific commands to fix issues

### 2. Node.js Script: `diagnose-rsya.js`

```bash
node diagnose-rsya.js
```

Same functionality as Python script, no dependencies required.

### 3. HTML Diagnostic Page: `diagnose-rsya-scheduler.html`

```bash
# Open in browser
open diagnose-rsya-scheduler.html
# or
firefox diagnose-rsya-scheduler.html
```

Features:
- Visual diagnostic dashboard
- Color-coded analysis
- Real-time data fetching
- No backend required

---

## 📋 Additional Issues Found

### Issue 1: No CRON Trigger Configured

**Problem**: The scheduler won't run automatically without a CRON trigger.

**Solution**: Set up a CRON job or Yandex Cloud Trigger:

```bash
# Option A: System crontab
0 * * * * curl -X GET https://functions.poehali.dev/e7523331-bd26-46dc-b5d0-984596fb7cc9

# Option B: Yandex Cloud Timer Trigger
# Create via Console: Functions → Triggers → Create Timer Trigger
# - Name: rsya-scheduler-cron
# - Cron Expression: 0 * * * ? *
# - Function: rsya-scheduler
```

### Issue 2: No Message Queue Trigger for Worker

**Problem**: Batches won't be processed without a trigger.

**Solution**: Create a Message Queue trigger:

```bash
# Via Yandex Cloud Console:
# Functions → Triggers → Create Trigger
# - Type: Message Queue
# - Queue: rsyacleaner
# - Function: rsya-batch-worker
# - Batch size: 1
# - Service Account: (same as scheduler)
```

---

## 🎯 Complete Setup Checklist

After fixing the AccessDeniedException, complete these steps:

- [ ] **Permissions**: Assign `ymq.writer` role to service account
- [ ] **Verify**: Test scheduler function manually
- [ ] **CRON**: Configure hourly trigger for rsya-scheduler
- [ ] **MQ Trigger**: Configure Message Queue trigger for rsya-batch-worker
- [ ] **Database**: Add projects to `rsya_project_schedule` table
- [ ] **Monitor**: Check batch processing in database
- [ ] **DLQ**: Set up rsya-dlq-processor CRON (for failed batches)
- [ ] **Poller**: Set up rsya-report-poller CRON (for async reports)

SQL to add projects to schedule:
```sql
INSERT INTO t_p97630513_yandex_cleaning_serv.rsya_project_schedule 
(project_id, interval_hours, next_run_at, is_active)
SELECT 
    id, 
    8,  -- Run every 8 hours (3x per day)
    NOW(), 
    TRUE
FROM t_p97630513_yandex_cleaning_serv.rsya_projects
WHERE yandex_token IS NOT NULL
ON CONFLICT (project_id) DO NOTHING;
```

---

## 📚 Reference Documentation

- **Batch System Setup**: `backend/BATCH_SYSTEM_SETUP.md`
- **Full Diagnosis Report**: `RSYA_SCHEDULER_DIAGNOSIS.md`
- **Yandex Message Queue Security**: https://cloud.yandex.com/en/docs/message-queue/security/
- **Service Account Roles**: https://cloud.yandex.ru/docs/iam/concepts/access-control/roles

---

## 🆘 Need More Help?

1. **Run diagnostics** using any of the provided tools
2. **Check function logs** in Yandex Cloud Console
3. **Review** the enhanced check-yc function output
4. **Verify** database state with SQL queries

All diagnostic information is available at:
**https://functions.poehali.dev/56553e1a-0378-4b18-bea1-de65b7498d5d**

---

## 📝 Summary

**Problem**: AccessDeniedException when sending to Message Queue  
**Root Cause**: Service account lacks `ymq.writer` role  
**Solution**: Assign role using provided command  
**Verification**: Test with provided diagnostic tools  
**Next Steps**: Configure triggers and monitor batches  

The diagnostic function has been enhanced and deployed. All tools are ready to use.
