-- Сбрасываем 5 площадок для теста с логами
UPDATE block_queue 
SET status = 'pending', 
    processed_at = NULL, 
    attempts = 0 
WHERE campaign_id = 116683139 
  AND status = 'completed'
  AND id IN (SELECT id FROM block_queue WHERE campaign_id = 116683139 AND status = 'completed' LIMIT 5);