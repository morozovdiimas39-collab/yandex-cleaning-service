-- Таблица очереди блокировки площадок
CREATE TABLE IF NOT EXISTS block_queue (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES rsya_tasks(id),
    campaign_id BIGINT NOT NULL,
    domain VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    UNIQUE(task_id, campaign_id, domain)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_block_queue_status ON block_queue(status);
CREATE INDEX IF NOT EXISTS idx_block_queue_task_id ON block_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_block_queue_created_at ON block_queue(created_at);

-- Таблица для хранения статуса задач
CREATE TABLE IF NOT EXISTS task_processing_status (
    task_id INTEGER PRIMARY KEY REFERENCES rsya_tasks(id),
    total_found INTEGER DEFAULT 0,
    total_queued INTEGER DEFAULT 0,
    total_blocked INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);