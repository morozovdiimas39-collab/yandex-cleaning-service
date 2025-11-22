-- Изменяем commission_rate с 15% на 20% для всех партнеров
UPDATE t_p97630513_yandex_cleaning_serv.partners 
SET commission_rate = 20.00 
WHERE commission_rate = 15.00;

-- Устанавливаем 20% как значение по умолчанию для новых партнеров
ALTER TABLE t_p97630513_yandex_cleaning_serv.partners 
ALTER COLUMN commission_rate SET DEFAULT 20.00;