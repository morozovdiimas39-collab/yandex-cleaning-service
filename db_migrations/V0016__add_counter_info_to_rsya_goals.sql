-- Добавляем информацию о счётчике в таблицу целей
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_goals 
ADD COLUMN IF NOT EXISTS counter_id VARCHAR(255);

ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_goals 
ADD COLUMN IF NOT EXISTS counter_name VARCHAR(500);