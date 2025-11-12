#!/bin/bash

echo "=========================================="
echo "ПОИСК УДАЛЕНИЯ В GIT ИСТОРИИ"
echo "=========================================="
echo ""

TARGET_ID="a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d"
FILE="backend/func2url.json"

echo "1. Поиск коммита где был удалён ID: $TARGET_ID"
echo "------------------------------------------"

# Используем git log с -S для поиска изменений содержимого
git log --all -p -S "$TARGET_ID" -- "$FILE" | head -50

echo ""
echo ""
echo "2. Все коммиты изменявшие $FILE (последние 15)"
echo "------------------------------------------"
git log --oneline -15 -- "$FILE"

echo ""
echo ""
echo "3. Поиск файлов с 'regions' в пути"
echo "------------------------------------------"
git log --all --name-only --pretty=format:"" -- "backend/*regions*" | sort | uniq

echo ""
echo ""
echo "4. Коммиты с 'regions' в сообщении"
echo "------------------------------------------"
git log --all --oneline --grep="region" -i | head -20

echo ""
echo ""
echo "5. Проверка текущего содержимого $FILE"
echo "------------------------------------------"
if [ -f "$FILE" ]; then
  echo "Файл существует. Проверяем наличие ID..."
  if grep -q "$TARGET_ID" "$FILE"; then
    echo "✅ ID $TARGET_ID НАЙДЕН в текущей версии"
  else
    echo "❌ ID $TARGET_ID НЕ НАЙДЕН в текущей версии"
  fi
else
  echo "❌ Файл $FILE не существует"
fi

echo ""
echo "=========================================="
