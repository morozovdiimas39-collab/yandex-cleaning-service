-- Reset next_run_at to NOW() for project 169 to trigger immediate automation run
UPDATE t_p97630513_yandex_cleaning_serv.rsya_project_schedule
SET next_run_at = NOW(),
    updated_at = NOW()
WHERE project_id = 169;