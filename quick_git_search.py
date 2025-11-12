#!/usr/bin/env python3
"""
Быстрый поиск удалённых файлов в Git истории
Использование: python3 quick_git_search.py
"""

import subprocess
import sys

def run(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    except:
        return ""

print("🔍 БЫСТРЫЙ ПОИСК В GIT ИСТОРИИ")
print("=" * 70)

TARGET_ID = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"

# 1. Поиск через git log -S
print(f"\n1️⃣  Поиск коммита с удалением ID: {TARGET_ID}")
print("-" * 70)

result = run(f'git log --all --oneline -S "{TARGET_ID}" -- backend/func2url.json')
if result:
    print("Найдены коммиты:\n")
    for line in result.split('\n')[:5]:
        print(f"  {line}")
else:
    print("  ❌ Коммиты не найдены")

# 2. Детальный diff
print(f"\n2️⃣  Детальная информация об изменениях")
print("-" * 70)

diff_result = run(f'git log --all -p -S "{TARGET_ID}" -- backend/func2url.json | head -80')
if diff_result:
    lines = diff_result.split('\n')
    commit_hash = None
    commit_date = None
    
    for i, line in enumerate(lines):
        if line.startswith('commit '):
            commit_hash = line.split()[1]
            print(f"\n📌 Коммит: {commit_hash}")
        elif line.startswith('Date:'):
            commit_date = line[5:].strip()
            print(f"📅 Дата: {commit_date}")
        elif line.startswith('    '):
            print(f"💬 Сообщение: {line.strip()}")
        elif line.startswith('-') and TARGET_ID in line and not line.startswith('---'):
            print(f"\n🗑️  Удалённая строка:")
            print(f"   {line}")
            # Показать контекст
            print(f"\n   Контекст:")
            for j in range(max(0, i-3), min(len(lines), i+4)):
                if lines[j].startswith(('+', '-')) and not lines[j].startswith(('+++', '---')):
                    print(f"   {lines[j][:80]}")
            break
else:
    print("  ❌ Детальная информация не найдена")

# 3. Поиск папок regions
print(f"\n3️⃣  Поиск папок с 'regions'")
print("-" * 70)

regions_files = run('git log --all --name-only --format="" -- "backend/*regions*" | sort | uniq')
if regions_files:
    files = [f for f in regions_files.split('\n') if f]
    if files:
        print(f"  ✅ Найдено {len(files)} файлов:\n")
        folders = set()
        for f in files[:10]:
            print(f"     - {f}")
            if '/' in f:
                folder = '/'.join(f.split('/')[:-1])
                folders.add(folder)
        
        if len(files) > 10:
            print(f"     ... и ещё {len(files) - 10} файлов")
        
        # Найти когда были удалены
        print(f"\n  📁 Найдено папок: {len(folders)}")
        for folder in sorted(folders):
            del_info = run(f'git log --all --diff-filter=D --format="%h|%aI|%s" -1 -- "{folder}/*"')
            if del_info and '|' in del_info:
                hash_val, date, msg = del_info.split('|', 2)
                print(f"\n     🗑️  {folder}/")
                print(f"        Удалена: {date[:10]} {date[11:16]}")
                print(f"        Коммит: {hash_val}")
                print(f"        Сообщение: {msg[:60]}")
    else:
        print("  ❌ Файлы не найдены")
else:
    print("  ❌ Папки с 'regions' не найдены в истории")

# 4. Последние изменения func2url.json
print(f"\n4️⃣  Последние 10 изменений backend/func2url.json")
print("-" * 70)

recent = run('git log --format="%h | %ai | %s" -10 -- backend/func2url.json')
if recent:
    for line in recent.split('\n'):
        if line:
            parts = line.split(' | ')
            if len(parts) >= 3:
                date = parts[1].split()[0] + ' ' + parts[1].split()[1][:5]
                print(f"  {parts[0]} | {date} | {parts[2][:50]}")
else:
    print("  ❌ История не найдена")

# 5. Коммиты с regions в сообщении
print(f"\n5️⃣  Коммиты с 'regions' в сообщении")
print("-" * 70)

grep_result = run('git log --all --oneline --grep="region" -i | head -10')
if grep_result:
    print()
    for line in grep_result.split('\n'):
        if line:
            print(f"  {line}")
else:
    print("  ❌ Не найдено")

print("\n" + "=" * 70)
print("✅ Анализ завершён!")
print("\nДля детального просмотра коммита используйте:")
print("  git show <хеш>")
print("\nДля просмотра файла в конкретном коммите:")
print("  git show <хеш>:backend/func2url.json")
print("=" * 70 + "\n")
