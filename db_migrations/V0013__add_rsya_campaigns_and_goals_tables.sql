-- Добавляем таблицу для хранения кампаний проекта
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

-- Добавляем таблицу для хранения целей проекта
CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.rsya_goals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    goal_id VARCHAR(255) NOT NULL,
    goal_name VARCHAR(500) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, goal_id)
);

-- Добавляем client_login в rsya_projects
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_projects 
ADD COLUMN IF NOT EXISTS client_login VARCHAR(255);

-- Добавляем статус настройки проекта
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_projects 
ADD COLUMN IF NOT EXISTS is_configured BOOLEAN DEFAULT false;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_rsya_campaigns_project_id ON t_p97630513_yandex_cleaning_serv.rsya_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_rsya_goals_project_id ON t_p97630513_yandex_cleaning_serv.rsya_goals(project_id);