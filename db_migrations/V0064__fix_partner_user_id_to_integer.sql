-- Изменяем тип user_id в partners с TEXT на INTEGER
ALTER TABLE t_p97630513_yandex_cleaning_serv.partners 
ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;

-- Изменяем тип referred_user_id в referrals с TEXT на INTEGER
ALTER TABLE t_p97630513_yandex_cleaning_serv.referrals
ALTER COLUMN referred_user_id TYPE INTEGER USING referred_user_id::INTEGER;