-- Сброс automation state к проекту 168
UPDATE t_p97630513_yandex_cleaning_serv.automation_state 
SET value = '{"project_id": 168}'::jsonb
WHERE key = 'rsya_automation_last_project_id';