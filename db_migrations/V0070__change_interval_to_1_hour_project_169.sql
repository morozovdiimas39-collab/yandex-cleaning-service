-- Меняем интервал на 1 час для быстрого тестирования
UPDATE t_p97630513_yandex_cleaning_serv.rsya_project_schedule
SET interval_hours = 1,
    next_run_at = NOW(),
    updated_at = NOW()
WHERE project_id = 169;
