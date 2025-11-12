-- Добавляем поле last_executed_at для отслеживания последнего запуска задачи
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_tasks 
ADD COLUMN last_executed_at TIMESTAMP DEFAULT NULL;

-- Добавляем индекс для быстрой выборки задач, готовых к запуску
CREATE INDEX idx_rsya_tasks_enabled_last_executed 
ON t_p97630513_yandex_cleaning_serv.rsya_tasks(enabled, last_executed_at) 
WHERE enabled = true;