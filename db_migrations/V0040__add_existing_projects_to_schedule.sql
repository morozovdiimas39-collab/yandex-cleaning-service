-- Добавляем все существующие проекты в расписание
INSERT INTO rsya_project_schedule (project_id, interval_hours, next_run_at, is_active)
SELECT 
    id, 
    8, 
    NOW(), 
    TRUE
FROM rsya_projects
WHERE yandex_token IS NOT NULL
ON CONFLICT (project_id) DO NOTHING;