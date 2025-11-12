-- Добавляем 1 тестовый проект в расписание для безопасного теста
INSERT INTO rsya_project_schedule (project_id, interval_hours, next_run_at, is_active)
VALUES (85, 8, NOW(), TRUE)
ON CONFLICT (project_id) DO NOTHING;