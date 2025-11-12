-- Сбрасываем все completed площадки обратно в pending
-- Теперь worker с проверкой попробует их заново
UPDATE block_queue 
SET status = 'pending', 
    attempts = 0, 
    processed_at = NULL
WHERE campaign_id = 116683139 
  AND status = 'completed';