-- Добавляем поле для ID счетчика Яндекс.Метрики
ALTER TABLE t_p97630513_yandex_cleaning_serv.telega_crm_projects 
ADD COLUMN IF NOT EXISTS metrika_counter_id TEXT;