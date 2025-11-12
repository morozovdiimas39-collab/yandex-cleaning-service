-- Таблица пользователей для авторизации
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    verification_code VARCHAR(6),
    code_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица проектов кластеризации
CREATE TABLE IF NOT EXISTS clustering_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    website_url TEXT,
    keywords_count INTEGER DEFAULT 0,
    clusters_count INTEGER DEFAULT 0,
    minus_words_count INTEGER DEFAULT 0,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_clustering_projects_user_id ON clustering_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);