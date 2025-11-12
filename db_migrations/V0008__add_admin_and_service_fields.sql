-- Добавляем поле is_admin в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Добавляем поля для бесконечной подписки и доступа к сервисам
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_infinite BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS allowed_services TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Комментарии для понимания
COMMENT ON COLUMN subscriptions.is_infinite IS 'Бесконечная подписка для VIP-пользователей';
COMMENT ON COLUMN subscriptions.allowed_services IS 'Массив ID сервисов, к которым есть доступ';