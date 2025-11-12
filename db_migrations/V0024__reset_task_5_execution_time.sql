-- Сброс времени последнего выполнения задачи для теста
UPDATE rsya_tasks 
SET last_executed_at = NOW() - INTERVAL '3 hours'
WHERE id = 5;