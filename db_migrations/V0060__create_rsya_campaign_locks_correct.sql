CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_campaign_locks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    campaign_id TEXT NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMP NOT NULL,
    worker_id TEXT,
    UNIQUE(project_id, campaign_id)
);