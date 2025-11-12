-- Сбрасываем next_run_at для тестирования блокировки
UPDATE rsya_project_schedule 
SET next_run_at = NOW() 
WHERE is_active = TRUE;