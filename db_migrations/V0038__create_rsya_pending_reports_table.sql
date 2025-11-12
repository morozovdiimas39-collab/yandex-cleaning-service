-- Таблица для async отчётов Яндекс Директ (201/202 статусы)
CREATE TABLE IF NOT EXISTS rsya_pending_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    task_id INTEGER,
    campaign_ids JSONB NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_rsya_pending_reports_status ON rsya_pending_reports(status, last_attempt_at);
CREATE INDEX IF NOT EXISTS idx_rsya_pending_reports_project ON rsya_pending_reports(project_id);