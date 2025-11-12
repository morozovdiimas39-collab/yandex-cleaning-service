# Инструкция: Поиск удалённых файлов в Git истории

## Цель
Найти в Git истории когда и в каком коммите были удалены:
1. Функция с ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` из `backend/func2url.json`
2. Папки `backend/wordstat-regions/` или `backend/regions/`

## Быстрый старт

### Вариант 1: Python скрипт (рекомендуется)
```bash
python3 quick_git_search.py
```

### Вариант 2: Полный анализ
```bash
python3 git_analysis_report.py
```

### Вариант 3: Bash скрипт
```bash
chmod +x find_deletion.sh
./find_deletion.sh
```

### Вариант 4: Node.js
```bash
node git-history-check.js
```

## Ручной поиск через Git команды

### 1. Найти коммит где была удалена функция

#### Метод A: Через git log -S (поиск изменений содержимого)
```bash
git log --all --oneline -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json
```

Покажет коммиты, где это значение было добавлено или удалено.

#### Метод B: Детальный diff
```bash
git log --all -p -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json
```

Покажет полный diff с удалением.

#### Метод C: Через историю коммитов
```bash
# Получить все коммиты
git log --all --format="%H|%aI|%s" -- backend/func2url.json

# Для каждого коммита проверить содержимое
git show <COMMIT_HASH>:backend/func2url.json | grep "a0ab9dc8"
```

### 2. Найти удалённые папки с regions

#### Метод A: Поиск удалённых файлов
```bash
# Найти все файлы с regions в пути
git log --all --name-only --format="" -- "backend/*regions*" | sort | uniq

# Найти коммит удаления для каждого файла
git log --all --diff-filter=D --summary -- "backend/wordstat-regions/*"
git log --all --diff-filter=D --summary -- "backend/regions/*"
```

#### Метод B: Через поиск по истории
```bash
# Все файлы когда-либо добавленные с regions
git log --all --pretty=format: --name-only --diff-filter=A | grep -i regions | sort | uniq

# Коммиты с удалениями в backend/
git log --all --diff-filter=D --oneline -- backend/
```

### 3. Найти по сообщениям коммитов
```bash
git log --all --oneline --grep="regions" -i
git log --all --oneline --grep="wordstat" -i
git log --all --oneline --grep="delete\|remove" -i -- backend/
```

## Интерпретация результатов

### Если функция была удалена, вы увидите:

```
commit a1b2c3d4e5f6...
Author: Developer Name
Date:   2024-XX-XX XX:XX:XX

    Remove unused wordstat-regions function

diff --git a/backend/func2url.json b/backend/func2url.json
--- a/backend/func2url.json
+++ b/backend/func2url.json
-  "wordstat-regions": "https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d",
```

**Ключевая информация:**
- **Хеш коммита**: `a1b2c3d4e5f6...` (полный хеш)
- **Дата удаления**: `2024-XX-XX XX:XX:XX`
- **Сообщение**: `Remove unused wordstat-regions function`
- **Удалённая строка**: Строка начинающаяся с `-`

### Если папка была удалена, вы увидите:

```
commit x7y8z9a1b2c3...
Author: Developer Name
Date:   2024-XX-XX XX:XX:XX

    Remove wordstat-regions backend folder

 delete mode 100644 backend/wordstat-regions/index.py
 delete mode 100644 backend/wordstat-regions/requirements.txt
 delete mode 100644 backend/wordstat-regions/tests.json
```

**Ключевая информация:**
- **Хеш коммита**: `x7y8z9a1b2c3...`
- **Дата удаления**: `2024-XX-XX XX:XX:XX`
- **Удалённые файлы**: Все файлы с `delete mode`

## Как получить точную дату и хеш

### Для функции в func2url.json:
```bash
# Найти коммит с удалением
COMMIT_HASH=$(git log --all --format="%H" -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json | head -1)

# Показать детали коммита
git show --format=fuller $COMMIT_HASH

# Показать только дату
git show --format="%aI" --no-patch $COMMIT_HASH

# Показать сообщение
git show --format="%s" --no-patch $COMMIT_HASH
```

### Для папки:
```bash
# Найти коммит удаления папки
git log --all --diff-filter=D --format="%H|%aI|%s" -1 -- "backend/wordstat-regions/*"

# Или для regions/
git log --all --diff-filter=D --format="%H|%aI|%s" -1 -- "backend/regions/*"
```

## Восстановление удалённых файлов

### Восстановить строку в func2url.json:
```bash
# Найти коммит ДО удаления (используйте ^)
git show <COMMIT_HASH>^:backend/func2url.json | grep "a0ab9dc8"

# Восстановить весь файл из коммита до удаления
git checkout <COMMIT_HASH>^ -- backend/func2url.json
```

### Восстановить удалённую папку:
```bash
# Восстановить всю папку
git checkout <COMMIT_HASH>^ -- backend/wordstat-regions/

# Или только посмотреть файлы
git show <COMMIT_HASH>^:backend/wordstat-regions/index.py
```

## Текущее состояние проекта

### Проблема
Функция `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` используется в коде но отсутствует в `backend/func2url.json`:

**Использование в коде:**
- `src/components/clustering/CitiesStep.tsx:54`
  ```typescript
  const response = await fetch('https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d');
  ```

### Альтернативная функция
В других местах используется функция `8b141446-430c-4c0b-b347-a0a2057c0ee8`:
- `src/pages/Wordstat.tsx:84`
- `fetch-regions.js:4`
- `test-regions.html:14`

Эта функция также НЕ зарегистрирована в `backend/func2url.json`.

## Полезные команды Git

### Просмотр истории файла:
```bash
# История изменений
git log --all --follow -- backend/func2url.json

# С diff
git log --all -p -- backend/func2url.json

# Последние 10 коммитов
git log --all --oneline -10 -- backend/func2url.json
```

### Поиск по содержимому:
```bash
# Найти все коммиты где встречается строка
git log --all -S "searchtext" --source --all

# С учётом регистра
git log --all -S "SearchText"

# Поиск по регулярному выражению
git log --all -G "regex.*pattern"
```

### Статистика изменений:
```bash
# Сколько раз менялся файл
git log --all --oneline -- backend/func2url.json | wc -l

# Кто менял файл
git log --all --format="%an" -- backend/func2url.json | sort | uniq -c | sort -nr
```

## Скрипты в проекте

Для удобства созданы следующие скрипты:

1. **quick_git_search.py** - быстрый поиск с основными результатами
2. **git_analysis_report.py** - полный детальный анализ
3. **find_deletion.sh** - bash скрипт для быстрой проверки
4. **git-history-check.js** - Node.js версия анализа
5. **analyze_git.py** - альтернативный Python анализ
6. **check_git_history.sh** - детальный bash анализ

## Ожидаемый результат

После выполнения анализа вы получите:

✅ **Хеш коммита** где была удалена функция  
✅ **Точную дату** удаления  
✅ **Сообщение коммита** с описанием изменения  
✅ **Контекст удаления** (какие строки были изменены)  
✅ **Информацию о папках** с regions (если они существовали)  
✅ **Хеш коммита** удаления папок (если они были удалены)  

## Следующие шаги

1. Запустите один из скриптов для получения точной информации
2. Сохраните хеши коммитов и даты удаления
3. Решите нужно ли:
   - Восстановить функцию в func2url.json
   - Обновить код для использования существующей функции
   - Зарегистрировать обе функции в func2url.json

---

**Документация создана**: 2025-11-08  
**Файлы проекта**: `/workspaces/poehali-yandex-cleaning-service/`
