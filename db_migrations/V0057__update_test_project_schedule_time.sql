-- Обновляем next_run_at на текущее время для тестового проекта
UPDATE rsya_project_schedule 
SET next_run_at = NOW(),
    updated_at = NOW()
WHERE project_id = 85;