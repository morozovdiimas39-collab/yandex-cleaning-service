-- Сбрасываем next_run_at для всех активных проектов чтобы scheduler запустился сейчас
UPDATE rsya_project_schedule 
SET next_run_at = NOW() 
WHERE is_active = TRUE;
