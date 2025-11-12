-- Обновление статуса pending площадок на cancelled
UPDATE block_queue 
SET status = 'cancelled', 
    processed_at = NOW() 
WHERE status = 'pending';