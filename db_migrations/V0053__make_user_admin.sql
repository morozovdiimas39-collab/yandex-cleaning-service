-- Сделать пользователя с телефоном 79161462849 администратором
UPDATE users SET is_admin = true WHERE phone = '79161462849';