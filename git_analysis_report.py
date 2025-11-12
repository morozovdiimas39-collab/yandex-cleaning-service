#!/usr/bin/env python3
"""
Анализ Git истории для поиска удалённых функций и папок
"""

import subprocess
import json
import re
from datetime import datetime

def git_cmd(command):
    """Выполнить Git команду и вернуть результат"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=False
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception as e:
        print(f"Ошибка выполнения команды: {e}")
        return None

def analyze_func2url_history():
    """Анализ истории func2url.json"""
    print("\n" + "=" * 80)
    print("АНАЛИЗ ИСТОРИИ backend/func2url.json")
    print("=" * 80 + "\n")
    
    target_id = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
    
    # Получить все коммиты
    commits_raw = git_cmd('git log --all --format="%H|%aI|%s" -- backend/func2url.json')
    
    if not commits_raw:
        print("❌ История func2url.json не найдена\n")
        return
    
    commits = []
    for line in commits_raw.split('\n'):
        if '|' in line:
            hash_val, date, message = line.split('|', 2)
            commits.append({'hash': hash_val, 'date': date, 'message': message})
    
    print(f"📊 Всего коммитов с изменениями: {len(commits)}\n")
    
    # Проверка каждого коммита
    found_in = None
    removed_in = None
    
    for i, commit in enumerate(commits):
        content = git_cmd(f'git show {commit["hash"]}:backend/func2url.json 2>/dev/null')
        
        if content and target_id in content:
            if not found_in:
                found_in = commit
                print(f"✅ ID {target_id} найден в коммите:")
                print(f"   Hash: {commit['hash']}")
                print(f"   Дата: {commit['date']}")
                print(f"   Сообщение: {commit['message']}\n")
        elif found_in and not removed_in:
            removed_in = commit
            print(f"🗑️  ID {target_id} был УДАЛЁН в коммите:")
            print(f"   Hash: {commit['hash']}")
            print(f"   Дата: {commit['date']}")
            print(f"   Сообщение: {commit['message']}\n")
            break
    
    if not found_in:
        print(f"❌ ID {target_id} не найден ни в одном коммите\n")
        return None
    elif not removed_in:
        print(f"⚠️  ID {target_id} всё ещё присутствует в самой ранней версии\n")
        return None
    
    return removed_in

def analyze_diff():
    """Детальный анализ через git diff"""
    print("\n" + "=" * 80)
    print("ДЕТАЛЬНЫЙ АНАЛИЗ ИЗМЕНЕНИЙ (GIT DIFF)")
    print("=" * 80 + "\n")
    
    target_id = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
    
    # Получить diff с изменениями
    diff_output = git_cmd(f'git log --all -p -S "{target_id}" -- backend/func2url.json')
    
    if not diff_output:
        print("❌ Diff не найден\n")
        return
    
    lines = diff_output.split('\n')
    
    current_commit = None
    current_date = None
    current_author = None
    found_deletion = False
    
    for i, line in enumerate(lines):
        if line.startswith('commit '):
            current_commit = line.split()[1]
        elif line.startswith('Author: '):
            current_author = line[8:].strip()
        elif line.startswith('Date:   '):
            current_date = line[8:].strip()
        elif line.startswith('-') and target_id in line and not line.startswith('---'):
            if not found_deletion:
                print("🎯 НАЙДЕНО УДАЛЕНИЕ В DIFF:")
                print(f"   Коммит: {current_commit}")
                print(f"   Дата: {current_date}")
                print(f"   Автор: {current_author}")
                print(f"\n   Удалённая строка:")
                print(f"   {line}\n")
                
                # Показать контекст
                print("   Контекст изменения:")
                start = max(0, i - 5)
                end = min(len(lines), i + 6)
                for j in range(start, end):
                    ctx_line = lines[j]
                    if ctx_line.startswith(('+', '-')) and not ctx_line.startswith(('+++', '---')):
                        marker = ">>>" if j == i else "   "
                        print(f"   {marker} {ctx_line[:100]}")
                
                print()
                found_deletion = True
                break
    
    if not found_deletion:
        print("❌ Удаление не обнаружено в diff\n")

def find_regions_folders():
    """Поиск папок с regions"""
    print("\n" + "=" * 80)
    print("ПОИСК ПАПОК С 'REGIONS'")
    print("=" * 80 + "\n")
    
    # Поиск всех файлов с regions в пути
    all_files = git_cmd('git log --all --name-only --format="" -- "backend/*regions*" | sort | uniq')
    
    if not all_files or not all_files.strip():
        print("❌ Файлы с 'regions' в backend/ не найдены в истории\n")
        return
    
    files = [f for f in all_files.split('\n') if f and 'regions' in f.lower()]
    
    if files:
        print(f"✅ Найдено {len(files)} файлов с 'regions' в истории:\n")
        
        folders = set()
        for filepath in files:
            parts = filepath.split('/')
            if len(parts) > 1:
                folders.add('/'.join(parts[:-1]))
        
        print("📁 Папки:")
        for folder in sorted(folders):
            print(f"   - {folder}/")
        print()
        
        # Для каждой папки найти когда была удалена
        for folder in sorted(folders):
            deletion_info = git_cmd(f'git log --all --diff-filter=D --format="%H|%aI|%s" -1 -- "{folder}/"')
            
            if deletion_info and '|' in deletion_info:
                hash_val, date, message = deletion_info.split('|', 2)
                print(f"🗑️  Папка: {folder}/")
                print(f"   Удалена: {date}")
                print(f"   Коммит: {hash_val}")
                print(f"   Сообщение: {message}\n")
        
        # Показать все файлы
        print("📄 Все файлы:")
        for filepath in sorted(files)[:20]:
            print(f"   - {filepath}")
        if len(files) > 20:
            print(f"   ... и ещё {len(files) - 20} файлов")
        print()

def search_commit_messages():
    """Поиск по сообщениям коммитов"""
    print("\n" + "=" * 80)
    print("ПОИСК В СООБЩЕНИЯХ КОММИТОВ")
    print("=" * 80 + "\n")
    
    keywords = ['regions', 'wordstat-regions', 'region', 'wordstat']
    
    for keyword in keywords:
        commits = git_cmd(f'git log --all --oneline --grep="{keyword}" -i')
        if commits:
            lines = commits.split('\n')[:5]
            if lines and lines[0]:
                print(f"🔍 Коммиты с '{keyword}' ({len(commits.split(chr(10)))} найдено):")
                for line in lines:
                    if line:
                        print(f"   {line}")
                print()

def recent_func2url_changes():
    """Последние изменения в func2url.json"""
    print("\n" + "=" * 80)
    print("ПОСЛЕДНИЕ 15 ИЗМЕНЕНИЙ backend/func2url.json")
    print("=" * 80 + "\n")
    
    recent = git_cmd('git log --format="%h|%aI|%s" -15 -- backend/func2url.json')
    
    if recent:
        for line in recent.split('\n'):
            if '|' in line:
                hash_val, date, message = line.split('|', 2)
                # Форматировать дату
                try:
                    dt = datetime.fromisoformat(date.replace('Z', '+00:00'))
                    date_str = dt.strftime('%Y-%m-%d %H:%M')
                except:
                    date_str = date
                
                print(f"{hash_val} | {date_str} | {message}")
        print()

def check_current_state():
    """Проверка текущего состояния"""
    print("\n" + "=" * 80)
    print("ТЕКУЩЕЕ СОСТОЯНИЕ")
    print("=" * 80 + "\n")
    
    target_id = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
    alternative_id = "8b141446-430c-4c0b-b347-a0a2057c0ee8"
    
    try:
        with open('backend/func2url.json', 'r') as f:
            content = f.read()
            data = json.loads(content)
            
            has_target = target_id in content
            has_alt = alternative_id in content
            
            print(f"📄 backend/func2url.json:")
            print(f"   ID {target_id}: {'✅ ПРИСУТСТВУЕТ' if has_target else '❌ ОТСУТСТВУЕТ'}")
            print(f"   ID {alternative_id}: {'✅ ПРИСУТСТВУЕТ' if has_alt else '❌ ОТСУТСТВУЕТ'}")
            print(f"   Всего функций: {len(data)}\n")
            
            # Показать функцию если есть
            for key, value in data.items():
                if target_id in value:
                    print(f"   Ключ для {target_id}: {key}")
                if alternative_id in value:
                    print(f"   Ключ для {alternative_id}: {key}")
            
    except FileNotFoundError:
        print("❌ Файл backend/func2url.json не найден\n")
    except json.JSONDecodeError:
        print("❌ Ошибка парсинга JSON\n")
    
    print()

def main():
    """Главная функция"""
    print("\n" + "=" * 80)
    print(" " * 20 + "GIT ИСТОРИЯ: ПОЛНЫЙ АНАЛИЗ")
    print("=" * 80)
    
    # Проверка текущего состояния
    check_current_state()
    
    # Анализ истории func2url.json
    removed_commit = analyze_func2url_history()
    
    # Детальный diff
    analyze_diff()
    
    # Поиск папок с regions
    find_regions_folders()
    
    # Поиск в сообщениях
    search_commit_messages()
    
    # Последние изменения
    recent_func2url_changes()
    
    # Итоговая сводка
    print("\n" + "=" * 80)
    print(" " * 25 + "ИТОГОВАЯ СВОДКА")
    print("=" * 80 + "\n")
    
    target_id = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
    
    if removed_commit:
        print(f"✅ Функция {target_id}:")
        print(f"   Статус: УДАЛЕНА")
        print(f"   Коммит удаления: {removed_commit['hash']}")
        print(f"   Дата удаления: {removed_commit['date']}")
        print(f"   Сообщение: {removed_commit['message']}\n")
    else:
        print(f"⚠️  Функция {target_id}:")
        print(f"   Статус: Не удалена или не найдена в истории\n")
    
    print("📝 Примечания:")
    print("   - Используйте хеш коммита для детального просмотра:")
    print("     git show <хеш>")
    print("   - Для восстановления файла:")
    print("     git checkout <хеш>^ -- <путь к файлу>")
    print("\n" + "=" * 80 + "\n")

if __name__ == '__main__':
    main()
