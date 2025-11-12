-- Добавление уникального индекса для rsya_platform_stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_rsya_platform_stats_unique 
ON t_p97630513_yandex_cleaning_serv.rsya_platform_stats 
(project_id, campaign_id, url, date_from, date_to, COALESCE(goal_id, ''));