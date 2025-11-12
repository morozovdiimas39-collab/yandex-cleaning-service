#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

def run_git_command(cmd):
    """Execute git command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def main():
    target_id = "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
    
    print("=" * 80)
    print("АНАЛИЗ GIT ИСТОРИИ: ПОИСК УДАЛЁННОЙ ФУНКЦИИ И ПАПОК")
    print("=" * 80)
    print()
    
    # 1. Найти все коммиты, изменявшие func2url.json
    print("📋 1. Анализ истории backend/func2url.json...")
    print("-" * 80)
    
    commits_output = run_git_command('git log --all --pretty=format:"%H|%ai|%s" -- backend/func2url.json')
    
    if not commits_output:
        print("❌ Файл backend/func2url.json не найден в истории")
        return
    
    commits = []
    for line in commits_output.split('\n'):
        if not line:
            continue
        parts = line.split('|', 2)
        if len(parts) >= 3:
            commits.append({
                'hash': parts[0],
                'date': parts[1],
                'message': parts[2]
            })
    
    print(f"✅ Найдено {len(commits)} коммитов с изменениями func2url.json")
    print()
    
    # 2. Проверить каждый коммит на наличие target_id
    print(f"🔍 2. Поиск ID {target_id}...")
    print("-" * 80)
    
    found_commit = None
    removed_commit = None
    
    for i, commit in enumerate(commits):
        content = run_git_command(f'git show {commit["hash"]}:backend/func2url.json')
        if content:
            has_id = target_id in content
            
            if has_id and not found_commit:
                found_commit = commit
                print(f"✅ ID найден в коммите {i+1}/{len(commits)}: {commit['hash'][:8]}")
            elif not has_id and found_commit and not removed_commit:
                removed_commit = commit
                print()
                print("🎯 ID БЫЛ УДАЛЁН!")
                print(f"   Коммит: {commit['hash']}")
                print(f"   Дата: {commit['date']}")
                print(f"   Сообщение: {commit['message']}")
                print()
                break
    
    # 3. Проверить через git log -S для точного diff
    print("🔬 3. Проверка через git diff...")
    print("-" * 80)
    
    diff_output = run_git_command(f'git log --all -p -S "{target_id}" -- backend/func2url.json')
    
    if diff_output:
        lines = diff_output.split('\n')
        current_hash = None
        current_date = None
        
        for i, line in enumerate(lines):
            if line.startswith('commit '):
                current_hash = line.split()[1]
            elif line.startswith('Date:'):
                current_date = line[5:].strip()
            elif line.startswith('-') and target_id in line and not line.startswith('---'):
                print("✅ Найдено удаление в diff:")
                print(f"   Коммит: {current_hash}")
                print(f"   Дата: {current_date}")
                print(f"   Удалённая строка: {line[:100]}...")
                print()
                
                # Показать больше контекста
                if i > 0:
                    print("   Контекст удаления:")
                    for j in range(max(0, i-3), min(len(lines), i+4)):
                        context_line = lines[j]
                        if context_line.startswith(('+', '-')) and not context_line.startswith(('+++', '---')):
                            print(f"   {context_line[:100]}")
                print()
                break
    else:
        print("❌ Diff не найден")
        print()
    
    # 4. Поиск папок с regions
    print("📁 4. Поиск папок backend/wordstat-regions/ и backend/regions/...")
    print("-" * 80)
    
    # Поиск всех файлов с regions в пути
    all_regions_files = run_git_command('git log --all --name-only --pretty=format:"" -- "backend/*regions*"')
    
    if all_regions_files:
        unique_files = sorted(set(line for line in all_regions_files.split('\n') if line and 'regions' in line.lower()))
        if unique_files:
            print("✅ Найдены файлы с 'regions' в истории:")
            for f in unique_files:
                print(f"   - {f}")
            print()
            
            # Для каждого файла найти когда он был удалён
            for filepath in unique_files:
                deletion_log = run_git_command(f'git log --all --diff-filter=D --pretty=format:"%H|%ai|%s" -1 -- "{filepath}"')
                if deletion_log:
                    parts = deletion_log.split('|', 2)
                    if len(parts) >= 3:
                        print(f"   🗑️  {filepath}")
                        print(f"      Удалён: {parts[1]}")
                        print(f"      Коммит: {parts[0]}")
                        print(f"      Сообщение: {parts[2]}")
                        print()
    else:
        print("❌ Файлы с 'regions' в backend/ не найдены в истории")
        print()
    
    # 5. Поиск по сообщениям коммитов
    print("💬 5. Коммиты с упоминанием 'regions' в сообщении...")
    print("-" * 80)
    
    grep_commits = run_git_command('git log --all --oneline --grep="regions" -i')
    if grep_commits:
        print("✅ Найдены коммиты:")
        for line in grep_commits.split('\n')[:10]:
            print(f"   {line}")
        print()
    else:
        print("❌ Коммиты с 'regions' в сообщении не найдены")
        print()
    
    # 6. Последние изменения func2url.json
    print("📝 6. Последние 10 изменений backend/func2url.json...")
    print("-" * 80)
    
    recent = run_git_command('git log --pretty=format:"%h|%ai|%s" -10 -- backend/func2url.json')
    if recent:
        for line in recent.split('\n'):
            if line:
                parts = line.split('|', 2)
                if len(parts) >= 3:
                    print(f"   {parts[0]} | {parts[1]} | {parts[2]}")
        print()
    
    # Итоговая сводка
    print("=" * 80)
    print("ИТОГОВАЯ СВОДКА")
    print("=" * 80)
    
    if removed_commit:
        print(f"✅ Функция {target_id} была удалена:")
        print(f"   Коммит: {removed_commit['hash']}")
        print(f"   Дата: {removed_commit['date']}")
        print(f"   Сообщение: {removed_commit['message']}")
    elif found_commit:
        print(f"⚠️  Функция {target_id} найдена в истории, но не удалена")
    else:
        print(f"❌ Функция {target_id} не найдена в истории func2url.json")
    
    print()

if __name__ == '__main__':
    main()
