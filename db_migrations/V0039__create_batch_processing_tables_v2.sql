-- Таблица для расписания проектов (3 раза в день = каждые 8 часов)
CREATE TABLE rsya_project_schedule (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE,
    interval_hours INTEGER NOT NULL DEFAULT 8,
    next_run_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_run_at TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rsya_schedule_next_run ON rsya_project_schedule(next_run_at) WHERE is_active = TRUE;

-- Таблица для батчей кампаний (для обработки через MQ)
CREATE TABLE rsya_campaign_batches (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    task_id INTEGER NULL,
    campaign_ids JSONB NOT NULL,
    batch_number INTEGER NOT NULL,
    total_batches INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    processing_time_sec INTEGER NULL
);

CREATE INDEX idx_rsya_batches_status ON rsya_campaign_batches(status);
CREATE INDEX idx_rsya_batches_project ON rsya_campaign_batches(project_id, status);

-- Таблица для блокировки кампаний (избегаем race condition при параллельной обработке)
CREATE TABLE rsya_campaign_locks (
    campaign_id VARCHAR(255) PRIMARY KEY,
    locked_by VARCHAR(255) NOT NULL,
    locked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX idx_rsya_locks_expires ON rsya_campaign_locks(expires_at);