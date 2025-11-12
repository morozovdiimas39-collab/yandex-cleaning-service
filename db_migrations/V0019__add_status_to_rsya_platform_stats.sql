ALTER TABLE rsya_platform_stats 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

UPDATE rsya_platform_stats 
SET status = CASE 
    WHEN is_blocked = true THEN 'blocked' 
    ELSE 'active' 
END 
WHERE status IS NULL OR status = 'active';