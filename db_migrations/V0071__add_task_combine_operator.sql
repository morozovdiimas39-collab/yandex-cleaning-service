-- Добавляем поля для объединения задач
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_tasks 
ADD COLUMN combine_operator VARCHAR(10) DEFAULT 'OR',
ADD COLUMN task_group_id INTEGER,
ADD COLUMN task_priority INTEGER DEFAULT 0;

COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.rsya_tasks.combine_operator IS 'Оператор объединения: OR - выполняются по отдельности, AND - объединяются в одну задачу';
COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.rsya_tasks.task_group_id IS 'ID группы для объединения задач с AND оператором';
COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.rsya_tasks.task_priority IS 'Приоритет выполнения задачи в группе';