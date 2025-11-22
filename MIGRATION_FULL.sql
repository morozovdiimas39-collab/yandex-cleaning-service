-- ============================================================
-- ПОЛНАЯ МИГРАЦИЯ ДЛЯ YANDEX CLEANING SERVICE
-- Дата: 2025-11-23
-- ============================================================

-- 1. ПАРТНЕРСКАЯ ПРОГРАММА (Affiliate Program)
-- ============================================================

-- Таблица партнеров
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) DEFAULT 20.00,
    total_earned NUMERIC(10,2) DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_referral_code ON partners(referral_code);

-- Таблица рефералов
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    referred_user_id INTEGER NOT NULL REFERENCES users(id),
    subscription_id INTEGER REFERENCES subscriptions(id),
    commission_amount NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_partner_id ON referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Таблица кликов по реферальным ссылкам
CREATE TABLE IF NOT EXISTS referral_clicks (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_partner_id ON referral_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_clicked_at ON referral_clicks(clicked_at);

-- Таблица выплат партнерам
CREATE TABLE IF NOT EXISTS partner_payouts (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_details TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);

-- ============================================================
-- 2. АНАЛИТИКА RSYA (мониторинг и снапшоты)
-- ============================================================

-- Снапшоты состояния очереди блокировок
CREATE TABLE IF NOT EXISTS rsya_queue_snapshots (
    id SERIAL PRIMARY KEY,
    pending_count INTEGER NOT NULL DEFAULT 0,
    processing_count INTEGER NOT NULL DEFAULT 0,
    blocked_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsya_queue_snapshots_created_at ON rsya_queue_snapshots(created_at);

-- Логи блокировок площадок
CREATE TABLE IF NOT EXISTS rsya_blocking_logs (
    id SERIAL PRIMARY KEY,
    execution_log_id INTEGER REFERENCES rsya_cleaning_execution_logs(id),
    project_id INTEGER NOT NULL REFERENCES rsya_projects(id),
    task_id INTEGER REFERENCES rsya_tasks(id),
    campaign_id BIGINT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    clicks INTEGER DEFAULT 0,
    cost NUMERIC(10,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cpa NUMERIC(10,2) DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_execution_log_id ON rsya_blocking_logs(execution_log_id);
CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_project_id ON rsya_blocking_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_task_id ON rsya_blocking_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_domain ON rsya_blocking_logs(domain);
CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_created_at ON rsya_blocking_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rsya_blocking_logs_action ON rsya_blocking_logs(action);

-- ============================================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================================

-- Проверка созданных таблиц
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = t.table_schema) as columns_count
FROM information_schema.tables t
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name IN (
    'partners', 'referrals', 'referral_clicks', 'partner_payouts',
    'rsya_queue_snapshots', 'rsya_blocking_logs'
  )
ORDER BY table_name;
