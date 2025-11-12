-- Сбрасываем статус площадок для повторной блокировки
-- Это нужно когда пользователь вручную удалил площадки из Яндекса
UPDATE block_queue 
SET status = 'pending', 
    processed_at = NULL, 
    attempts = 0 
WHERE campaign_id = 116683139 
  AND status = 'completed';