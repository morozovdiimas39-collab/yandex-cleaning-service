-- CRITICAL FIX: Create schema and all tables for production database
-- Target DB: postgresql://rsya_user:rsya_pass_2024@158.160.56.38:5432/rsya_cleaner

-- 1. Create schema if not exists
CREATE SCHEMA IF NOT EXISTS t_p97630513_yandex_cleaning_serv;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    verification_code VARCHAR(6),
    code_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    session_token VARCHAR(64),
    token_expires_at TIMESTAMP,
    is_admin BOOLEAN DEFAULT false
);

-- 3. Create rsya_projects table (CRITICAL!)
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    yandex_token TEXT,
    client_login VARCHAR(255),
    is_configured BOOLEAN DEFAULT false,
    campaign_ids TEXT,
    counter_ids TEXT,
    auto_add_campaigns BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create rsya_campaigns table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_campaigns (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(500) NOT NULL,
    campaign_status VARCHAR(50),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, campaign_id)
);

-- 5. Create rsya_goals table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_goals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    goal_id VARCHAR(255) NOT NULL,
    goal_name VARCHAR(500) NOT NULL,
    counter_id VARCHAR(255),
    counter_name VARCHAR(500),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, goal_id)
);

-- 6. Create rsya_platform_stats table
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
    status VARCHAR(50),
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create rsya_tasks table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    description TEXT,
    config JSONB,
    enabled BOOLEAN DEFAULT true,
    last_executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create task_history table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    placements_checked INTEGER DEFAULT 0,
    placements_blocked INTEGER DEFAULT 0,
    status VARCHAR(50),
    error_message TEXT
);

-- 9. Create block_queue table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.block_queue (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    project_id INTEGER,
    campaign_id TEXT NOT NULL,
    url TEXT NOT NULL,
    cost NUMERIC(12, 2),
    impressions INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    ctr NUMERIC(8, 4),
    cpc NUMERIC(10, 2),
    cpa NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 10. Create rsya_project_schedule table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_project_schedule (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE,
    interval_hours INTEGER DEFAULT 8,
    next_run_at TIMESTAMP NOT NULL,
    last_run_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create rsya_cleaning_execution_logs table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_cleaning_execution_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    task_id INTEGER,
    execution_type VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    placements_found INTEGER DEFAULT 0,
    placements_matched INTEGER DEFAULT 0,
    placements_sent_to_queue INTEGER DEFAULT 0,
    placements_blocked INTEGER DEFAULT 0,
    status VARCHAR(50),
    error_message TEXT
);

-- 12. Create rsya_campaign_batches table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_campaign_batches (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    campaign_id TEXT NOT NULL,
    batch_number INTEGER NOT NULL,
    total_placements INTEGER DEFAULT 0,
    processed_placements INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(project_id, campaign_id, batch_number)
);

-- 13. Create rsya_campaign_locks table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_campaign_locks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    campaign_id TEXT NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMP NOT NULL,
    worker_id TEXT,
    UNIQUE(project_id, campaign_id)
);

-- 14. Create rsya_pending_reports table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_pending_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    report_id TEXT UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_check_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- 15. Create automation_state table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.automation_state (
    id SERIAL PRIMARY KEY,
    state_key TEXT UNIQUE NOT NULL,
    state_value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Create wordstat_tasks table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.wordstat_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    region_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    processed_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Create clustering_projects table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.clustering_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(500) NOT NULL,
    source VARCHAR(50),
    goal TEXT,
    website_url TEXT,
    selected_cities JSONB DEFAULT '[]',
    selected_intents JSONB DEFAULT '[]',
    keywords_count INTEGER DEFAULT 0,
    clusters_count INTEGER DEFAULT 0,
    minus_words_count INTEGER DEFAULT 0,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Create clustering_results table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.clustering_results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    clusters JSONB NOT NULL,
    minus_words JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Create subscriptions table
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'trial',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    trial_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    is_infinite BOOLEAN DEFAULT false,
    allowed_services TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Create partners and related tables
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.partners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    partner_code VARCHAR(50) UNIQUE NOT NULL,
    commission_percent NUMERIC(5, 2) DEFAULT 20.00,
    total_referrals INTEGER DEFAULT 0,
    total_earnings NUMERIC(12, 2) DEFAULT 0,
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.referrals (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL,
    referred_user_id INTEGER UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.referral_clicks (
    id SERIAL PRIMARY KEY,
    partner_code VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.partner_payouts (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method TEXT,
    payment_details JSONB,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_rsya_projects_user_id ON t_p97630513_yandex_cleaning_serv.rsya_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_rsya_campaigns_project_id ON t_p97630513_yandex_cleaning_serv.rsya_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_rsya_goals_project_id ON t_p97630513_yandex_cleaning_serv.rsya_goals(project_id);
CREATE INDEX IF NOT EXISTS idx_platform_stats_project ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats(project_id, campaign_id, date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_rsya_tasks_project_id ON t_p97630513_yandex_cleaning_serv.rsya_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON t_p97630513_yandex_cleaning_serv.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_block_queue_status ON t_p97630513_yandex_cleaning_serv.block_queue(status);
CREATE INDEX IF NOT EXISTS idx_block_queue_task_id ON t_p97630513_yandex_cleaning_serv.block_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_next_run ON t_p97630513_yandex_cleaning_serv.rsya_project_schedule(next_run_at, is_active);
CREATE INDEX IF NOT EXISTS idx_users_phone ON t_p97630513_yandex_cleaning_serv.users(phone);