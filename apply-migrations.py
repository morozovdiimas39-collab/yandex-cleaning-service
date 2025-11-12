#!/usr/bin/env python3
"""
Скрипт для применения всех миграций к новой базе данных
"""

import os
import sys
import glob

try:
    import psycopg2
except ImportError:
    print("❌ Ошибка: psycopg2 не установлен!")
    print("Установи его командой: pip install psycopg2-binary")
    sys.exit(1)

DATABASE_URL = "postgresql://rsya_user:StrongPass_2024_RSYa@158.160.56.38:5432/rsya_cleaner"

def main():
    print("🚀 Применение миграций к новой базе данных...")
    print(f"Database: {DATABASE_URL}")
    print()
    
    # Проверка подключения
    print("Проверка подключения...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Подключение успешно!")
        print(f"   PostgreSQL: {version.split(',')[0]}")
        cursor.close()
        conn.close()
        print()
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        print("Проверь что:")
        print("1. PostgreSQL запущен на сервере")
        print("2. Порт 5432 открыт (sudo ufw allow 5432/tcp)")
        print("3. Credentials правильные")
        sys.exit(1)
    
    # Получаем список миграций
    migrations = sorted(glob.glob("db_migrations/V*.sql"))
    
    if not migrations:
        print("❌ Миграции не найдены в папке db_migrations/")
        sys.exit(1)
    
    print(f"📦 Найдено миграций: {len(migrations)}")
    print()
    
    # Счётчики
    success = 0
    failed = 0
    skipped = 0
    
    # Применяем миграции
    for migration_path in migrations:
        filename = os.path.basename(migration_path)
        print(f"📝 {filename}...", end=" ")
        
        try:
            with open(migration_path, 'r', encoding='utf-8') as f:
                sql = f.read()
            
            conn = psycopg2.connect(DATABASE_URL)
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Выполняем SQL
            cursor.execute(sql)
            
            cursor.close()
            conn.close()
            
            print("✅")
            success += 1
            
        except psycopg2.errors.DuplicateTable as e:
            print("⏭️  (уже применена)")
            skipped += 1
        except psycopg2.errors.DuplicateObject as e:
            print("⏭️  (уже применена)")
            skipped += 1
        except Exception as e:
            print(f"❌")
            print(f"   Ошибка: {e}")
            failed += 1
            # Продолжаем даже если есть ошибка
    
    print()
    print("=" * 60)
    print(f"✅ Успешно применено: {success} миграций")
    print(f"⏭️  Пропущено (уже применены): {skipped} миграций")
    print(f"❌ С ошибками: {failed} миграций")
    print("=" * 60)
    print()
    
    # Проверка таблиц
    print("📊 Проверка созданных таблиц...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"   Создано таблиц: {len(tables)}")
            for table in tables[:10]:  # Первые 10
                print(f"   - {table[0]}")
            if len(tables) > 10:
                print(f"   ... и ещё {len(tables) - 10} таблиц")
        else:
            print("   ⚠️  Таблицы не найдены!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"   ⚠️  Ошибка проверки: {e}")
    
    print()
    print("🎉 Миграция завершена!")
    print()
    print("Твой DATABASE_URL для GitHub секретов:")
    print(DATABASE_URL)

if __name__ == "__main__":
    main()
