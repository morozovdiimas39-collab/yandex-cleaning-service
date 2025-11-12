-- Добавляем project_id в block_queue для round robin балансировки
ALTER TABLE block_queue 
ADD COLUMN project_id INTEGER;

-- Заполняем project_id для существующих записей
UPDATE block_queue bq
SET project_id = t.project_id
FROM rsya_tasks t
WHERE bq.task_id = t.id;

-- Делаем NOT NULL после заполнения
ALTER TABLE block_queue 
ALTER COLUMN project_id SET NOT NULL;

-- Добавляем внешний ключ
ALTER TABLE block_queue
ADD CONSTRAINT fk_block_queue_project 
FOREIGN KEY (project_id) REFERENCES rsya_projects(id);

-- Создаем составной индекс для быстрого round robin
CREATE INDEX idx_block_queue_project_status_created 
ON block_queue(project_id, status, created_at);

-- Индекс для быстрого поиска проектов с pending площадками
CREATE INDEX idx_block_queue_status_created 
ON block_queue(status, created_at) WHERE status = 'pending';
