CREATE TABLE t_p97630513_yandex_cleaning_serv.rsya_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rsya_tasks_project_id ON t_p97630513_yandex_cleaning_serv.rsya_tasks(project_id);