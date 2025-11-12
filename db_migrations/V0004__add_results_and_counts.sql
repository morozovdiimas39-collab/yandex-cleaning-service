-- Add results column to clustering_projects
ALTER TABLE clustering_projects 
ADD COLUMN IF NOT EXISTS results JSONB DEFAULT NULL;

-- Add other count columns if they don't exist
ALTER TABLE clustering_projects
ADD COLUMN IF NOT EXISTS keywords_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clusters_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minus_words_count INTEGER DEFAULT 0;