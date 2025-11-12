-- Создание таблицы проектов для РСЯ чистки
CREATE TABLE IF NOT EXISTS rsya_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    yandex_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_rsya_projects_user_id ON rsya_projects(user_id);
CREATE INDEX idx_rsya_projects_created_at ON rsya_projects(created_at DESC);