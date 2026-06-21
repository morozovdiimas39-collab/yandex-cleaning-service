CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.admin_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    password_iterations INTEGER NOT NULL DEFAULT 310000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.admin_sessions (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES t_p97630513_yandex_cleaning_serv.admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.admin_auth_audit (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT REFERENCES t_p97630513_yandex_cleaning_serv.admin_users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash
    ON t_p97630513_yandex_cleaning_serv.admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active
    ON t_p97630513_yandex_cleaning_serv.admin_sessions(expires_at)
    WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_auth_audit_created_at
    ON t_p97630513_yandex_cleaning_serv.admin_auth_audit(created_at DESC);

INSERT INTO t_p97630513_yandex_cleaning_serv.admin_users
    (username, password_salt, password_hash, password_iterations, must_change_password)
VALUES
    ('admin', 'c0f47a089662478e4118187140262f1b', '41707f42e52fb3b3ed14f922f994692c3cef8bd9169cec76f90d4b30249b333b', 310000, TRUE)
ON CONFLICT (username) DO NOTHING;
