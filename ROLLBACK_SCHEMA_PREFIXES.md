# Откат: Вернул все schema prefixes обратно

## Изменённые файлы:
- backend/rsya-projects/index.py - вернул все `t_p97630513_yandex_cleaning_serv.` перед таблицами
- backend/auth/index.py - вернул schema prefix для users
- backend/yandex-platform-stats/index.py - вернул schema prefix для всех таблиц
- backend/rsya-batch-worker/index.py - вернул schema prefix для rsya_campaign_batches, rsya_campaign_locks, rsya_pending_reports
- backend/rsya-block-worker/index.py - вернул schema prefix для block_queue, rsya_projects
- backend/rsya-scheduler/index.py - вернул schema prefix для rsya_project_schedule, rsya_projects, rsya_campaign_batches

## Причина:
Таблицы физически находятся в схеме `t_p97630513_yandex_cleaning_serv`, а НЕ в `public`.
Удаление prefix привело к ошибкам "table not found".

## Решение:
Вернул ВСЕ schema prefixes обратно как было до моих изменений.
