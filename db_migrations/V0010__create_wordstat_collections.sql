CREATE TABLE IF NOT EXISTS wordstat_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    regions INTEGER[] NOT NULL,
    mode TEXT DEFAULT 'context',
    total_pages INTEGER DEFAULT 40,
    current_page INTEGER DEFAULT 0,
    phrases JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wordstat_collections_user_id ON wordstat_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_wordstat_collections_status ON wordstat_collections(status);
CREATE INDEX IF NOT EXISTS idx_wordstat_collections_created_at ON wordstat_collections(created_at DESC);