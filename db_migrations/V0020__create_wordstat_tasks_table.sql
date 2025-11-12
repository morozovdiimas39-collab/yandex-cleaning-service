CREATE TABLE IF NOT EXISTS wordstat_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    project_id INTEGER,
    query TEXT NOT NULL,
    regions TEXT,
    mode VARCHAR(50),
    selected_intents TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    result TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wordstat_tasks_user_id ON wordstat_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_wordstat_tasks_status ON wordstat_tasks(status);
CREATE INDEX IF NOT EXISTS idx_wordstat_tasks_created_at ON wordstat_tasks(created_at);