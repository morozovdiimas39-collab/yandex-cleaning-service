-- Сбрасываем все площадки 116683139 после финального фикса дубликатов
-- Теперь используем единый seen set для new_domains И current_excluded
UPDATE block_queue 
SET status = 'pending', 
    attempts = 0, 
    processed_at = NULL,
    error_message = NULL
WHERE campaign_id = 116683139 
  AND status IN ('failed', 'processing', 'completed');