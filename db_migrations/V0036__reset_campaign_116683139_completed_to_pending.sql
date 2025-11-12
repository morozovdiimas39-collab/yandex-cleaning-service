-- Reset completed platforms for campaign 116683139 back to pending
-- They were marked as completed but not actually blocked in Yandex
UPDATE block_queue
SET status = 'pending', attempts = 0
WHERE campaign_id = 116683139 AND status = 'completed';
