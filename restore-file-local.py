#!/usr/bin/env python3
import subprocess
import sys

# Используем git show для получения файла из коммита 1e84b6d
commit = '1e84b6dda36b6a91cd57e0746415da909c42527c'
file_path = 'src/components/clustering/ResultsStep.tsx'

print(f'Восстанавливаю файл {file_path} из коммита {commit}...')

try:
    # Получаем содержимое файла из коммита
    result = subprocess.run(
        ['git', 'show', f'{commit}:{file_path}'],
        capture_output=True,
        text=True,
        check=True
    )
    
    content = result.stdout
    
    # Сохраняем в текущую директорию
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ Файл успешно восстановлен: {file_path}')
    print(f'Размер: {len(content)} символов')
    
except subprocess.CalledProcessError as e:
    print(f'❌ Ошибка при выполнении git команды: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Ошибка: {e}')
    sys.exit(1)
