-- Сброс next_run_at для проекта 169
UPDATE t_p97630513_yandex_cleaning_serv.rsya_project_schedule 
SET next_run_at = NOW() - INTERVAL '1 minute' 
WHERE project_id = 169;