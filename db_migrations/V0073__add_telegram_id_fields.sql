-- Добавляем telegram_id в users для хранения личного Telegram ID пользователя
ALTER TABLE t_p97630513_yandex_cleaning_serv.users 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT;

COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.users.telegram_id IS 'Telegram ID пользователя для отправки личных сообщений от ботов';

-- Добавляем новое поле owner_telegram_id в telega_crm_projects (дублирование для быстрого доступа)
ALTER TABLE t_p97630513_yandex_cleaning_serv.telega_crm_projects
ADD COLUMN IF NOT EXISTS owner_telegram_id BIGINT;

COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.telega_crm_projects.telegram_chat_id IS 'ID группы/канала (необязательно). Если NULL - отправляем в личку владельцу';
COMMENT ON COLUMN t_p97630513_yandex_cleaning_serv.telega_crm_projects.owner_telegram_id IS 'Telegram ID владельца проекта (из users.telegram_id). Используется если telegram_chat_id = NULL';