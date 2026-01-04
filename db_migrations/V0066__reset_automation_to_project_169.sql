-- Сброс automation state чтобы он начал с проекта 169
UPDATE automation_state 
SET value = '{"project_id": 168}'::jsonb
WHERE key = 'rsya_automation_last_project_id';