-- Table for storing automation progress state
CREATE TABLE IF NOT EXISTS automation_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_automation_state_updated_at ON automation_state(updated_at);

-- Insert initial state
INSERT INTO automation_state (key, value) 
VALUES 
    ('rsya_automation_last_project_id', '{"project_id": 0}'::jsonb),
    ('rsya_rotation_last_campaign_id', '{"campaign_id": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;