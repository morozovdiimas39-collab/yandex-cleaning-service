-- Сбрасываем застрявшие в processing после ошибки дублей
UPDATE block_queue 
SET status = 'pending', 
    attempts = 0
WHERE campaign_id = 116683139 
  AND status = 'processing';