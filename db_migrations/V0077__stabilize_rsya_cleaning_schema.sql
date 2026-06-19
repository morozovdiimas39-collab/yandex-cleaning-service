-- Stabilize RSYA cleaning tables for the canonical scheduler/batch/poller/block pipeline.

ALTER TABLE t_p97630513_yandex_cleaning_serv.block_queue
ADD COLUMN IF NOT EXISTS domain VARCHAR(500),
ADD COLUMN IF NOT EXISTS project_id INTEGER,
ADD COLUMN IF NOT EXISTS cpa NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS error_message TEXT;

UPDATE t_p97630513_yandex_cleaning_serv.block_queue
SET domain = COALESCE(domain, url)
WHERE domain IS NULL;

DELETE FROM t_p97630513_yandex_cleaning_serv.block_queue a
USING t_p97630513_yandex_cleaning_serv.block_queue b
WHERE a.ctid < b.ctid
  AND a.task_id = b.task_id
  AND a.campaign_id = b.campaign_id
  AND a.domain = b.domain;

CREATE UNIQUE INDEX IF NOT EXISTS idx_block_queue_task_campaign_domain_unique
ON t_p97630513_yandex_cleaning_serv.block_queue(task_id, campaign_id, domain);

ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_pending_reports
ADD COLUMN IF NOT EXISTS campaign_ids TEXT,
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE,
ADD COLUMN IF NOT EXISTS report_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches
ADD COLUMN IF NOT EXISTS campaign_ids TEXT,
ADD COLUMN IF NOT EXISTS total_batches INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS processing_time_sec INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_tasks
ADD COLUMN IF NOT EXISTS combine_operator VARCHAR(10) DEFAULT 'AND',
ADD COLUMN IF NOT EXISTS task_group_id INTEGER,
ADD COLUMN IF NOT EXISTS task_priority INTEGER DEFAULT 0;
