CREATE TABLE IF NOT EXISTS wordstat_results (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    keywords TEXT NOT NULL,
    region_id INTEGER NOT NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'context',
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    clusters JSONB,
    minus_phrases JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wordstat_user ON wordstat_results(user_id);
CREATE INDEX IF NOT EXISTS idx_wordstat_status ON wordstat_results(status);
CREATE INDEX IF NOT EXISTS idx_wordstat_created ON wordstat_results(created_at DESC);