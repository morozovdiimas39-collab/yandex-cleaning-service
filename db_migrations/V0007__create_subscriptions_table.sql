-- Создание таблицы подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'trial',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    trial_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);