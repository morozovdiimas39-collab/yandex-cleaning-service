-- Таблица пользователей (профилей)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    verification_code VARCHAR(6),
    code_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Таблица проектов кластеризации
CREATE TABLE clustering_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    intent_filter VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    keywords_count INTEGER DEFAULT 0,
    clusters_count INTEGER DEFAULT 0,
    minus_words_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица результатов кластеризации
CREATE TABLE clustering_results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES clustering_projects(id),
    clusters JSONB NOT NULL,
    minus_words JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_projects_user_id ON clustering_projects(user_id);
CREATE INDEX idx_results_project_id ON clustering_results(project_id);