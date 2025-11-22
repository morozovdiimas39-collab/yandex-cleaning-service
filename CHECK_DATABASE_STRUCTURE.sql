-- ============================================================
-- ПРОВЕРКА СТРУКТУРЫ БАЗЫ ДАННЫХ
-- Этот скрипт покажет, что уже есть в твоей базе
-- ============================================================

-- 1. СПИСОК ВСЕХ ТАБЛИЦ В СХЕМЕ
-- ============================================================
SELECT 
    '=== ВСЕ ТАБЛИЦЫ В СХЕМЕ ===' as info;

SELECT 
    schemaname as "Схема",
    tablename as "Таблица",
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = schemaname 
       AND table_name = tablename) as "Колонок"
FROM pg_tables
WHERE schemaname = CURRENT_SCHEMA()
ORDER BY tablename;

-- ============================================================
-- 2. ПРОВЕРКА НУЖНЫХ ТАБЛИЦ
-- ============================================================
SELECT 
    '=== ПРОВЕРКА ТАБЛИЦ ДЛЯ МИГРАЦИИ ===' as info;

SELECT 
    t.table_name as "Таблица",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = CURRENT_SCHEMA() 
              AND table_name = t.table_name
        ) THEN '✅ Существует'
        ELSE '❌ Отсутствует'
    END as "Статус"
FROM (
    VALUES 
        ('users'),
        ('subscriptions'),
        ('rsya_projects'),
        ('rsya_tasks'),
        ('rsya_cleaning_execution_logs'),
        ('partners'),
        ('referrals'),
        ('referral_clicks'),
        ('partner_payouts'),
        ('rsya_queue_snapshots'),
        ('rsya_blocking_logs')
) AS t(table_name)
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = CURRENT_SCHEMA() 
              AND table_name = t.table_name
        ) THEN 0
        ELSE 1
    END,
    t.table_name;

-- ============================================================
-- 3. ДЕТАЛИ ПО ТАБЛИЦАМ ПАРТНЕРКИ (если существуют)
-- ============================================================
SELECT 
    '=== ТАБЛИЦЫ ПАРТНЕРСКОЙ ПРОГРАММЫ ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
        RAISE NOTICE '✅ partners - существует';
    ELSE
        RAISE NOTICE '❌ partners - отсутствует (будет создана)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        RAISE NOTICE '✅ referrals - существует';
    ELSE
        RAISE NOTICE '❌ referrals - отсутствует (будет создана)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_clicks') THEN
        RAISE NOTICE '✅ referral_clicks - существует';
    ELSE
        RAISE NOTICE '❌ referral_clicks - отсутствует (будет создана)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_payouts') THEN
        RAISE NOTICE '✅ partner_payouts - существует';
    ELSE
        RAISE NOTICE '❌ partner_payouts - отсутствует (будет создана)';
    END IF;
END $$;

-- ============================================================
-- 4. ДЕТАЛИ ПО ТАБЛИЦАМ RSYA АНАЛИТИКИ (если существуют)
-- ============================================================
SELECT 
    '=== ТАБЛИЦЫ RSYA АНАЛИТИКИ ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rsya_queue_snapshots') THEN
        RAISE NOTICE '✅ rsya_queue_snapshots - существует';
        RAISE NOTICE 'Количество записей: %', (SELECT COUNT(*) FROM rsya_queue_snapshots);
    ELSE
        RAISE NOTICE '❌ rsya_queue_snapshots - отсутствует (будет создана)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rsya_blocking_logs') THEN
        RAISE NOTICE '✅ rsya_blocking_logs - существует';
        RAISE NOTICE 'Количество записей: %', (SELECT COUNT(*) FROM rsya_blocking_logs);
    ELSE
        RAISE NOTICE '❌ rsya_blocking_logs - отсутствует (будет создана)';
    END IF;
END $$;

-- ============================================================
-- 5. СТРУКТУРА СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- ============================================================
SELECT 
    '=== СТРУКТУРА rsya_queue_snapshots ===' as info;

SELECT 
    column_name as "Колонка",
    data_type as "Тип",
    is_nullable as "NULL?",
    column_default as "По умолчанию"
FROM information_schema.columns
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name = 'rsya_queue_snapshots'
ORDER BY ordinal_position;

SELECT 
    '=== СТРУКТУРА rsya_blocking_logs ===' as info;

SELECT 
    column_name as "Колонка",
    data_type as "Тип",
    is_nullable as "NULL?",
    column_default as "По умолчанию"
FROM information_schema.columns
WHERE table_schema = CURRENT_SCHEMA()
  AND table_name = 'rsya_blocking_logs'
ORDER BY ordinal_position;

-- ============================================================
-- 6. ИНДЕКСЫ НА СУЩЕСТВУЮЩИХ ТАБЛИЦАХ
-- ============================================================
SELECT 
    '=== ИНДЕКСЫ НА ТАБЛИЦАХ ===' as info;

SELECT 
    tablename as "Таблица",
    indexname as "Индекс",
    indexdef as "Определение"
FROM pg_indexes
WHERE schemaname = CURRENT_SCHEMA()
  AND tablename IN (
    'partners', 'referrals', 'referral_clicks', 'partner_payouts',
    'rsya_queue_snapshots', 'rsya_blocking_logs'
  )
ORDER BY tablename, indexname;

-- ============================================================
-- 7. FOREIGN KEYS
-- ============================================================
SELECT 
    '=== ВНЕШНИЕ КЛЮЧИ ===' as info;

SELECT
    tc.table_name as "Таблица", 
    kcu.column_name as "Колонка",
    ccu.table_name AS "Связь с таблицей",
    ccu.column_name AS "Связь с колонкой"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = CURRENT_SCHEMA()
  AND tc.table_name IN (
    'partners', 'referrals', 'referral_clicks', 'partner_payouts',
    'rsya_queue_snapshots', 'rsya_blocking_logs'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================
-- 8. ИТОГОВАЯ СВОДКА
-- ============================================================
SELECT 
    '=== ИТОГОВАЯ СВОДКА ===' as info;

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = CURRENT_SCHEMA()) as "Всего таблиц",
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = CURRENT_SCHEMA()
       AND table_name IN ('partners', 'referrals', 'referral_clicks', 
                         'partner_payouts', 'rsya_queue_snapshots', 'rsya_blocking_logs')) 
    as "Таблиц из миграции существует",
    6 as "Таблиц нужно создать";

-- ============================================================
-- КОНЕЦ ПРОВЕРКИ
-- ============================================================
