-- Add missing columns to clustering_projects
ALTER TABLE clustering_projects 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS selected_cities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS selected_intents JSONB DEFAULT '[]';