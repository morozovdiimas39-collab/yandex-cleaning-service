-- Возвращаем cancelled площадки обратно в pending для повторной обработки
UPDATE block_queue 
SET status = 'pending', 
    attempts = 0,
    processed_at = NULL
WHERE status = 'cancelled';