-- Расширяем поля cost и cpa для больших значений (до 99 млрд)
ALTER TABLE block_queue 
ALTER COLUMN cost TYPE NUMERIC(12, 2),
ALTER COLUMN cpa TYPE NUMERIC(12, 2);
