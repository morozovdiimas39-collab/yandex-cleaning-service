-- Сброс next_run_at для проекта 169 (Тест Дагестан) для немедленного запуска
UPDATE rsya_project_schedule 
SET next_run_at = NOW() - INTERVAL '1 minute'
WHERE project_id = 169;