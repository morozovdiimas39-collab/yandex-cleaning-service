-- Создаём таблицы для TelegaCRM

-- Проекты TelegaCRM (один пользователь = много проектов)
CREATE TABLE IF NOT EXISTS telega_crm_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    bot_token TEXT NOT NULL,
    telegram_chat_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Заявки (leads)
CREATE TABLE IF NOT EXISTS telega_crm_leads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    course TEXT,
    message_text TEXT,
    status TEXT DEFAULT 'new',
    telegram_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES telega_crm_projects(id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_telega_projects_user_id ON telega_crm_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_telega_leads_project_id ON telega_crm_leads(project_id);
CREATE INDEX IF NOT EXISTS idx_telega_leads_status ON telega_crm_leads(status);