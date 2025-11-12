-- Create clustering_projects table
CREATE TABLE IF NOT EXISTS clustering_projects (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    source VARCHAR(50) NOT NULL,
    goal TEXT,
    website_url TEXT,
    selected_cities JSONB DEFAULT '[]',
    selected_intents JSONB DEFAULT '[]',
    keywords_count INTEGER DEFAULT 0,
    clusters_count INTEGER DEFAULT 0,
    minus_words_count INTEGER DEFAULT 0,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clustering_projects_user_id ON clustering_projects(user_id);
CREATE INDEX idx_clustering_projects_created_at ON clustering_projects(created_at DESC);