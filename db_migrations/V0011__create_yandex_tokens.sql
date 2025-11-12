CREATE TABLE IF NOT EXISTS yandex_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    yandex_login TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yandex_tokens_user_id ON yandex_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_yandex_tokens_yandex_login ON yandex_tokens(yandex_login);