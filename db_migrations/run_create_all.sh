#!/bin/bash
# Скопируй этот файл на ВМ и запусти: bash run_create_all.sh
# Или из папки проекта: bash db_migrations/run_create_all.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
SQL="$DIR/ONE_SHOT_CREATE_ALL.sql"
if [ ! -f "$SQL" ]; then
  echo "Файл ONE_SHOT_CREATE_ALL.sql не найден рядом со скриптом."
  exit 1
fi
sudo -u postgres psql -d postgres -f "$SQL"
