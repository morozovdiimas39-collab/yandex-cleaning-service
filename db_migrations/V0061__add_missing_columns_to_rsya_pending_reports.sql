ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_pending_reports 
ADD COLUMN IF NOT EXISTS campaign_ids TEXT,
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE,
ADD COLUMN IF NOT EXISTS report_name TEXT;