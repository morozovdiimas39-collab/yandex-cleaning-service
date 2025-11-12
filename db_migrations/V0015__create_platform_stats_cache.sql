CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_platform_stats (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    url TEXT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    goal_id TEXT,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    cost NUMERIC(12, 2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC(8, 4),
    cpc NUMERIC(10, 2),
    cpa NUMERIC(10, 2),
    is_blocked BOOLEAN DEFAULT false,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_stats_project ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_platform_stats_campaign ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_platform_stats_dates ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_platform_stats_cached_at ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats(cached_at);