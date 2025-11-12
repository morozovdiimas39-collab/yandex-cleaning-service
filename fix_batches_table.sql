-- Fix rsya_campaign_batches structure
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
  DROP COLUMN IF EXISTS campaign_id,
  ADD COLUMN IF NOT EXISTS campaign_ids TEXT,
  ADD COLUMN IF NOT EXISTS total_batches INTEGER,
  ADD COLUMN IF NOT EXISTS processing_time_sec INTEGER;

-- Drop old unique constraint
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
  DROP CONSTRAINT IF EXISTS rsya_campaign_batches_project_id_campaign_id_batch_number_key;

-- Add new unique constraint
ALTER TABLE t_p97630513_yandex_cleaning_serv.rsya_campaign_batches 
  ADD CONSTRAINT rsya_campaign_batches_unique 
  UNIQUE(project_id, batch_number);
