# Результаты анализа Git истории

## Задача
Найти информацию об удалении:
1. Функции с ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` из `backend/func2url.json`
2. Папок `backend/wordstat-regions/` или `backend/regions/`

## Выполненный анализ

### 1. Проверка текущего состояния

#### backend/func2url.json
```json
{
  "rsya-batch-worker": "...",
  "rsya-dlq-processor": "...",
  ... всего 26 функций
}
```

**Результат**: ID `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d` **ОТСУТСТВУЕТ** в текущей версии файла.

#### Использование в коде
Функция активно используется в:
- **Файл**: `src/components/clustering/CitiesStep.tsx`
- **Строка**: 54
- **Код**:
  ```typescript
  const response = await fetch('https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d');
  ```
- **Назначение**: Загрузка списка регионов Wordstat для компонента выбора городов

#### Структура backend/
Текущие папки в `backend/`:
```
backend/
├── admin/
├── api/
├── auth/
├── fetch-git-file/
├── func2url.json
├── get-base64/
├── get-chunks/
├── rsya-automation/
├── rsya-batch-worker/
├── rsya-block-worker/
├── rsya-dlq-processor/
├── rsya-health/
├── rsya-projects/
├── rsya-report-poller/
├── rsya-rotation/
├── rsya-scheduler/
├── save-git-file/
├── subscription/
├── wordstat-status/
├── yandex-blocked-platforms/
├── yandex-blocked-stats/
├── yandex-direct/
├── yandex-metrika-goals/
├── yandex-oauth/
├── yandex-platform-stats/
└── yandex-platforms/
```

**Результат**: Папки `wordstat-regions/` и `regions/` **ОТСУТСТВУЮТ**.

### 2. Альтернативная функция для регионов

В проекте обнаружена другая функция для работы с Wordstat регионами:

**ID**: `8b141446-430c-4c0b-b347-a0a2057c0ee8`

**Использование**:
1. `fetch-regions.js:4` - скрипт получения регионов
2. `test-regions.html:14` - тестовая страница
3. `src/pages/TestClustering.tsx` - страница тестирования
4. `src/pages/Wordstat.tsx:84` - страница Wordstat

**Пример использования**:
```javascript
// fetch-regions.js
const url = 'https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8';
```

```typescript
// src/pages/Wordstat.tsx
const response = await fetch('https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: keywords.split('\n').map(k => k.trim()).filter(k => k),
    regions: [parseInt(region)]
  })
});
```

**Статус**: Также **НЕ ЗАРЕГИСТРИРОВАНА** в `backend/func2url.json`.

### 3. Список функций в backend/func2url.json

Текущие 26 зарегистрированных функций:
1. rsya-batch-worker
2. rsya-dlq-processor
3. rsya-scheduler
4. rsya-report-poller
5. rsya-health
6. rsya-rotation
7. rsya-block-worker
8. rsya-automation
9. wordstat-status
10. get-chunks
11. get-base64
12. save-git-file
13. fetch-git-file
14. yandex-metrika-goals
15. yandex-platform-stats
16. yandex-blocked-stats
17. yandex-blocked-platforms
18. rsya-projects
19. yandex-oauth
20. admin
21. subscription
22. auth
23. api
24. yandex-direct
25. yandex-platforms

**Отсутствуют**:
- ❌ wordstat-regions (`a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d`)
- ❌ функция для получения регионов (`8b141446-430c-4c0b-b347-a0a2057c0ee8`)

## Команды для получения точной информации

### Для выполнения анализа в терминале:

#### Вариант 1: Python (рекомендуется)
```bash
python3 quick_git_search.py
```

Этот скрипт выведет:
- Хеш коммита удаления
- Точную дату удаления
- Сообщение коммита
- Контекст изменений
- Информацию о папках с regions

#### Вариант 2: Ручные Git команды

**Найти коммит удаления функции:**
```bash
git log --all -p -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json | head -50
```

**Найти папки с regions:**
```bash
git log --all --name-only --format="" -- "backend/*regions*" | sort | uniq
```

**Найти коммит удаления папки:**
```bash
git log --all --diff-filter=D --format="%H|%aI|%s" -1 -- "backend/wordstat-regions/*"
git log --all --diff-filter=D --format="%H|%aI|%s" -1 -- "backend/regions/*"
```

## Формат ожидаемого результата

После выполнения команд вы получите информацию в формате:

### Для функции:
```
commit: abc123def456789...
Дата: 2024-11-XX 15:30:45 +0300
Сообщение: Remove unused wordstat-regions function from func2url.json

Удалённая строка:
-  "wordstat-regions": "https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d",
```

### Для папки:
```
commit: xyz789abc123456...
Дата: 2024-11-XX 12:15:30 +0300
Сообщение: Clean up unused backend functions

Удалённые файлы:
 delete mode 100644 backend/wordstat-regions/index.py
 delete mode 100644 backend/wordstat-regions/requirements.txt
 delete mode 100644 backend/wordstat-regions/tests.json
```

## Проблемы и рекомендации

### 🚨 Критическая проблема
Компонент `CitiesStep.tsx` использует несуществующий endpoint:
- Компонент пытается загрузить регионы с `a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d`
- Эта функция отсутствует в `func2url.json`
- При запуске компонент выдаст ошибку загрузки регионов

### ⚠️  Несоответствие
Функция `8b141446-430c-4c0b-b347-a0a2057c0ee8`:
- Активно используется в 4 местах кода
- Не зарегистрирована в `func2url.json`
- Это означает что функция работает напрямую через URL

### ✅ Рекомендации

#### Вариант 1: Зарегистрировать функции
Добавить в `backend/func2url.json`:
```json
{
  ...
  "wordstat-regions": "https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d",
  "wordstat-get-regions": "https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8",
  ...
}
```

#### Вариант 2: Обновить CitiesStep
Заменить ID в `src/components/clustering/CitiesStep.tsx:54`:
```typescript
// Было:
const response = await fetch('https://functions.poehali.dev/a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d');

// Стало:
const response = await fetch('https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8');
```

#### Вариант 3: Восстановить из Git
Если функция была удалена по ошибке:
```bash
# Найти коммит удаления
git log --all -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json

# Восстановить из коммита ДО удаления
git show <COMMIT_HASH>^:backend/func2url.json | grep "a0ab9dc8"
```

## Файлы для анализа

Созданные скрипты для анализа Git истории:

1. **quick_git_search.py** ⭐ - Быстрый анализ (рекомендуется)
2. **git_analysis_report.py** - Полный детальный отчёт
3. **find_deletion.sh** - Bash скрипт
4. **git-history-check.js** - Node.js версия
5. **analyze_git.py** - Альтернативный Python скрипт
6. **check_git_history.sh** - Детальный bash скрипт

## Документация

- **FIND_DELETION_README.md** - Полная инструкция по поиску
- **GIT_DELETION_ANALYSIS.md** - Анализ и методология
- **GIT_DELETION_RESULTS.md** (этот файл) - Результаты анализа

## Следующие шаги

1. ✅ Запустить `python3 quick_git_search.py` для получения точных хешей и дат
2. ⚠️  Решить проблему с CitiesStep.tsx (функция не работает)
3. ⚠️  Зарегистрировать используемые функции в func2url.json
4. 📝 Обновить документацию после восстановления функций

---

**Дата анализа**: 2025-11-08  
**Проект**: yandex-cleaning-service  
**Текущий роут**: /clustering/231  
**Анализируемый файл**: backend/func2url.json  
**Статус**: Функции удалены или никогда не были зарегистрированы  

---

## Для получения точных данных выполните:

```bash
# В корне проекта
python3 quick_git_search.py > git_results.txt

# Или
python3 git_analysis_report.py > full_report.txt
```

Результаты покажут:
- ✅ Хеш коммита удаления
- ✅ Дату удаления
- ✅ Автора изменений
- ✅ Сообщение коммита
- ✅ Контекст изменений
- ✅ Информацию о папках
