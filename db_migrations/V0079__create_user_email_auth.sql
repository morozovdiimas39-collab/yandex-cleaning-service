CREATE TABLE IF NOT EXISTS t_p97630513_yandex_cleaning_serv.user_email_auth (
    user_id INTEGER PRIMARY KEY REFERENCES t_p97630513_yandex_cleaning_serv.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    password_iterations INTEGER NOT NULL,
    verification_code VARCHAR(6),
    code_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
