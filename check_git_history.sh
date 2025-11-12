#!/bin/bash

echo "=== 1. Поиск ID a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d в истории backend/func2url.json ==="
git log --all --full-history --pretty=format:"%H|%ai|%s" -- backend/func2url.json | while IFS='|' read hash date message; do
    if git show "$hash:backend/func2url.json" 2>/dev/null | grep -q "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"; then
        echo "НАЙДЕНО В КОММИТЕ:"
        echo "  Hash: $hash"
        echo "  Дата: $date"
        echo "  Сообщение: $message"
        echo ""
    fi
done

echo ""
echo "=== 2. Поиск удалённой папки backend/wordstat-regions/ ==="
git log --all --full-history --diff-filter=D --pretty=format:"%H|%ai|%s" -- backend/wordstat-regions/ 2>/dev/null | head -1

echo ""
echo "=== 3. Поиск удалённой папки backend/regions/ ==="
git log --all --full-history --diff-filter=D --pretty=format:"%H|%ai|%s" -- backend/regions/ 2>/dev/null | head -1

echo ""
echo "=== 4. Все коммиты упоминающие 'regions' или 'wordstat-regions' ==="
git log --all --oneline --grep="regions\|wordstat-regions" -i

echo ""
echo "=== 5. Коммиты изменяющие файлы с 'regions' в пути ==="
git log --all --oneline --name-only --full-history | grep -B1 -i "regions"

echo ""
echo "=== 6. Последние изменения в backend/func2url.json ==="
git log --pretty=format:"%H|%ai|%s" -10 -- backend/func2url.json

echo ""
echo "=== 7. Поиск файлов содержащих a0ab9dc8 в истории ==="
git log --all --oneline -S "a0ab9dc8" -- backend/

echo ""
echo "=== 8. Детальная информация об удалении из func2url.json ==="
git log --all -p -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json | head -100
