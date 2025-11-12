-- Создание таблицы для истории выполнения задач автоматизации РСЯ
CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    placements_checked INTEGER NOT NULL DEFAULT 0,
    placements_blocked INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска истории по задачам
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- Индекс для сортировки по времени
CREATE INDEX IF NOT EXISTS idx_task_history_executed_at ON task_history(executed_at DESC);
