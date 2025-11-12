ALTER TABLE users ADD COLUMN session_token VARCHAR(64);
ALTER TABLE users ADD COLUMN token_expires_at TIMESTAMP;