-- Добавляем метрики в block_queue для приоритизации
ALTER TABLE block_queue 
ADD COLUMN clicks INTEGER DEFAULT 0,
ADD COLUMN cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN conversions INTEGER DEFAULT 0,
ADD COLUMN cpa NUMERIC(10, 2) DEFAULT 0;

-- Индекс для сортировки по приоритету (вредные площадки с большими расходами первыми)
CREATE INDEX idx_block_queue_priority 
ON block_queue(project_id, status, cost DESC, clicks DESC) 
WHERE status = 'pending';