# Анализ Git истории: Удалённые функции и папки

## Задача
Найти в Git истории информацию о:
1. Когда была удалена функция с ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` из `backend/func2url.json`
2. Когда была удалена папка `backend/wordstat-regions/` или `backend/regions/`
3. Хеш коммита где это было удалено
4. Дату удаления

## Текущее состояние

### Файл backend/func2url.json
- **Статус**: Файл существует
- **ID a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d**: ❌ ОТСУТСТВУЕТ в текущей версии
- **Всего функций**: 26

### Использование в коде
Функция с ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` используется в:
- `src/components/clustering/CitiesStep.tsx` (строка 54)
- Вызывается для загрузки списка регионов Wordstat

```typescript
// src/components/clustering/CitiesStep.tsx:54
const response = await fetch('https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d');
```

### Альтернативная функция
В проекте также используется другая функция для работы с регионами:
- **ID**: `8b141446-430c-4c0b-b347-a0a2057c0ee8`
- **Использование**:
  - `fetch-regions.js`
  - `test-regions.html`
  - `src/pages/TestClustering.tsx`
  - `src/pages/Wordstat.tsx`
- **Статус в func2url.json**: ❌ ОТСУТСТВУЕТ

## Команды для поиска в Git

### Для запуска анализа выполните:

#### Вариант 1: Python скрипт (полный анализ)
```bash
python3 git_analysis_report.py
```

#### Вариант 2: Bash скрипт (быстрый анализ)
```bash
chmod +x find_deletion.sh
./find_deletion.sh
```

#### Вариант 3: Node.js скрипт
```bash
node git-history-check.js
```

### Ручные Git команды

#### 1. Найти коммит удаления функции из func2url.json
```bash
# Поиск изменений содержащих ID
git log --all -p -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json

# Показать все коммиты изменявшие func2url.json
git log --oneline --all -- backend/func2url.json

# Показать diff последних изменений
git log --all -p -10 -- backend/func2url.json
```

#### 2. Найти удалённые папки с regions
```bash
# Поиск файлов с 'regions' в пути
git log --all --name-only --format="" -- "backend/*regions*" | sort | uniq

# Поиск удалённых файлов в backend/wordstat-regions/
git log --all --diff-filter=D --summary -- "backend/wordstat-regions/*"

# Поиск удалённых файлов в backend/regions/
git log --all --diff-filter=D --summary -- "backend/regions/*"

# Все файлы когда-либо существовавшие с 'regions' в пути
git log --all --pretty=format: --name-only --diff-filter=A | grep -i regions | sort | uniq
```

#### 3. Поиск по сообщениям коммитов
```bash
# Коммиты с упоминанием 'regions'
git log --all --oneline --grep="regions" -i

# Коммиты с упоминанием 'wordstat'
git log --all --oneline --grep="wordstat" -i

# Все коммиты за последний месяц изменявшие backend/
git log --all --oneline --since="1 month ago" -- backend/
```

#### 4. Проверить содержимое файла в конкретном коммите
```bash
# Показать func2url.json в коммите
git show <COMMIT_HASH>:backend/func2url.json

# Найти когда ID присутствовал последний раз
git log --all --format="%H|%aI|%s" -- backend/func2url.json | while IFS='|' read hash date msg; do
  if git show "$hash:backend/func2url.json" 2>/dev/null | grep -q "a0ab9dc8"; then
    echo "Найден в: $hash | $date | $msg"
  fi
done
```

## Возможные результаты

### Если функция была удалена
Вы увидите коммит примерно такого вида:
```
commit abc123def456...
Author: Developer Name <email@example.com>
Date:   YYYY-MM-DD HH:MM:SS

    Commit message describing the change

diff --git a/backend/func2url.json b/backend/func2url.json
--- a/backend/func2url.json
+++ b/backend/func2url.json
-  "wordstat-regions": "https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d",
```

### Если папка была удалена
```
commit xyz789abc123...
Author: Developer Name <email@example.com>
Date:   YYYY-MM-DD HH:MM:SS

    Remove wordstat-regions backend function

 delete mode 100644 backend/wordstat-regions/index.py
 delete mode 100644 backend/wordstat-regions/requirements.txt
```

## Как восстановить удалённые файлы

### Восстановить функцию в func2url.json
```bash
# Найти коммит ДО удаления (коммит^)
git show <COMMIT_HASH>^:backend/func2url.json > func2url.json.backup

# Или восстановить конкретную строку
git show <COMMIT_HASH>^:backend/func2url.json | grep "a0ab9dc8"
```

### Восстановить удалённую папку
```bash
# Восстановить всю папку из коммита ДО удаления
git checkout <COMMIT_HASH>^ -- backend/wordstat-regions/

# Или посмотреть содержимое
git show <COMMIT_HASH>^:backend/wordstat-regions/index.py
```

## Примечания

1. **Функция используется но не зарегистрирована**: ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` используется в `CitiesStep.tsx` но отсутствует в `func2url.json`

2. **Альтернативная функция**: ID `8b141446-430c-4c0b-b347-a0a2057c0ee8` используется в других местах для работы с Wordstat регионами

3. **Проверка работоспособности**: Если функция удалена из `func2url.json`, но используется в коде, это может привести к ошибкам при загрузке регионов

## Следующие шаги

1. Запустите один из скриптов анализа для получения точной информации
2. Проверьте работоспособность компонента `CitiesStep` 
3. Решите, нужно ли:
   - Восстановить удалённую функцию
   - Обновить код для использования альтернативной функции
   - Зарегистрировать функции в `func2url.json`

---

**Дата создания отчёта**: 2025-11-08  
**Файлы для анализа**: 
- `git_analysis_report.py` - полный Python анализ
- `git-history-check.js` - Node.js анализ  
- `find_deletion.sh` - быстрый Bash анализ
- `analyze_git.py` - альтернативный Python анализ
- `check_git_history.sh` - детальный Bash анализ
