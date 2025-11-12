-- Сбрасываем failed площадки для повторной попытки с новой логикой изоляции
UPDATE block_queue 
SET status = 'pending', 
    attempts = 0, 
    processed_at = NULL,
    error_message = NULL
WHERE campaign_id = 116683139 
  AND status = 'failed';