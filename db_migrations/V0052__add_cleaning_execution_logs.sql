-- Таблица для детальных логов выполнения функций чистки
CREATE TABLE IF NOT EXISTS rsya_cleaning_execution_logs (
    id SERIAL PRIMARY KEY,
    execution_type VARCHAR(50) NOT NULL, -- 'automation', 'block_worker', 'report_poller'
    project_id INTEGER REFERENCES rsya_projects(id),
    task_id INTEGER REFERENCES rsya_tasks(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'success', 'error', 'timeout'
    request_id VARCHAR(255), -- request_id из контекста облачной функции
    placements_found INTEGER DEFAULT 0,
    placements_matched INTEGER DEFAULT 0,
    placements_sent_to_queue INTEGER DEFAULT 0,
    placements_blocked INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB, -- дополнительная информация (батчи, кампании и т.д.)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cleaning_logs_execution_type ON rsya_cleaning_execution_logs(execution_type);
CREATE INDEX idx_cleaning_logs_project_id ON rsya_cleaning_execution_logs(project_id);
CREATE INDEX idx_cleaning_logs_task_id ON rsya_cleaning_execution_logs(task_id);
CREATE INDEX idx_cleaning_logs_started_at ON rsya_cleaning_execution_logs(started_at DESC);
CREATE INDEX idx_cleaning_logs_status ON rsya_cleaning_execution_logs(status);

-- Таблица для детальных логов блокировки площадок
CREATE TABLE IF NOT EXISTS rsya_blocking_logs (
    id SERIAL PRIMARY KEY,
    execution_log_id INTEGER REFERENCES rsya_cleaning_execution_logs(id),
    project_id INTEGER NOT NULL REFERENCES rsya_projects(id),
    task_id INTEGER REFERENCES rsya_tasks(id),
    campaign_id BIGINT NOT NULL,
    domain VARCHAR(500) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'sent_to_queue', 'blocked', 'already_blocked', 'failed'
    clicks INTEGER DEFAULT 0,
    cost NUMERIC(12,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cpa NUMERIC(12,2) DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocking_logs_execution_log_id ON rsya_blocking_logs(execution_log_id);
CREATE INDEX idx_blocking_logs_project_id ON rsya_blocking_logs(project_id);
CREATE INDEX idx_blocking_logs_task_id ON rsya_blocking_logs(task_id);
CREATE INDEX idx_blocking_logs_action ON rsya_blocking_logs(action);
CREATE INDEX idx_blocking_logs_created_at ON rsya_blocking_logs(created_at DESC);
CREATE INDEX idx_blocking_logs_domain ON rsya_blocking_logs(domain);

-- Таблица для статистики очереди (снапшоты состояния)
CREATE TABLE IF NOT EXISTS rsya_queue_snapshots (
    id SERIAL PRIMARY KEY,
    pending_count INTEGER NOT NULL DEFAULT 0,
    processing_count INTEGER NOT NULL DEFAULT 0,
    blocked_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queue_snapshots_created_at ON rsya_queue_snapshots(created_at DESC);