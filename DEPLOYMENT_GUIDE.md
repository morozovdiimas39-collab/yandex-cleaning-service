# Полная инструкция по развертыванию проекта на своем сервере

## Архитектура проекта

Проект состоит из трех частей:
- **Frontend** - React SPA (Vite + TypeScript)
- **Backend** - Python/TypeScript Cloud Functions (17 функций)
- **Database** - PostgreSQL

## Часть 1: Подготовка сервера

### Требования к серверу:
- Ubuntu 20.04+ / Debian 11+
- Минимум 2GB RAM
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Nginx
- Git

### 1.1. Установка зависимостей на сервере

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Устанавливаем Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Устанавливаем PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Устанавливаем Nginx
sudo apt install -y nginx

# Устанавливаем PM2 для управления процессами
sudo npm install -g pm2
```

### 1.2. Настройка PostgreSQL

```bash
# Входим в PostgreSQL
sudo -u postgres psql

# Создаем базу данных и пользователя
CREATE DATABASE yandex_cleaning_serv;
CREATE USER your_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE yandex_cleaning_serv TO your_user;
\q

# Включаем удаленный доступ (если нужно)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Раскомментируйте: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Добавьте: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

## Часть 2: Подключение GitHub и клонирование

### 2.1. В poehali.dev

1. Нажмите **Скачать → Подключить GitHub**
2. Авторизуйтесь и выберите аккаунт
3. Код загрузится в новый репозиторий

### 2.2. На сервере

```bash
# Создаем директорию для проекта
mkdir -p /var/www/yandex-cleaning
cd /var/www/yandex-cleaning

# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Настраиваем Git для автоматической синхронизации
git config pull.rebase false
```

## Часть 3: Настройка Frontend

### 3.1. Установка зависимостей

```bash
cd /var/www/yandex-cleaning

# Устанавливаем зависимости
npm install
```

### 3.2. Настройка переменных окружения

```bash
# Создаем .env файл
nano .env.production
```

Содержимое `.env.production`:
```env
VITE_API_URL=https://your-domain.com/api
VITE_BACKEND_URL=https://your-domain.com/backend
```

### 3.3. Сборка frontend

```bash
npm run build
# Билд появится в папке dist/
```

### 3.4. Настройка Nginx для Frontend

```bash
sudo nano /etc/nginx/sites-available/yandex-cleaning
```

Содержимое конфига:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/yandex-cleaning/dist;
    index index.html;
    
    # Основной frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Проксирование к backend функциям
    location /backend/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Статические файлы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируем конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/yandex-cleaning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.5. SSL сертификат (опционально)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Часть 4: Настройка Backend Functions

### 4.1. Создание структуры для backend

```bash
cd /var/www/yandex-cleaning

# Создаем директорию для backend runner
mkdir -p backend-server
```

### 4.2. Создание Backend API Gateway

```bash
nano backend-server/server.py
```

Содержимое `server.py`:
```python
#!/usr/bin/env python3
import os
import json
import importlib.util
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any

# Добавляем папку backend в путь поиска модулей
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)

class BackendHandler(BaseHTTPRequestHandler):
    
    def load_function(self, function_name: str):
        """Динамически загружает функцию из папки backend"""
        function_path = os.path.join(backend_dir, function_name)
        
        # Ищем index.py или index.ts
        py_path = os.path.join(function_path, 'index.py')
        ts_path = os.path.join(function_path, 'index.ts')
        
        if os.path.exists(py_path):
            spec = importlib.util.spec_from_file_location(f"{function_name}.handler", py_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module.handler
        elif os.path.exists(ts_path):
            # Для TypeScript функций нужен отдельный Node.js процесс
            # Пока возвращаем заглушку
            return None
        
        return None
    
    def do_OPTIONS(self):
        """Обрабатываем CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token, X-User-Id')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
    
    def handle_request(self):
        """Общий обработчик запросов"""
        parsed = urlparse(self.path)
        path_parts = parsed.path.strip('/').split('/')
        
        if not path_parts or path_parts[0] == '':
            self.send_error(404, "Function not specified")
            return
        
        function_name = path_parts[0]
        handler = self.load_function(function_name)
        
        if not handler:
            self.send_error(404, f"Function {function_name} not found")
            return
        
        # Читаем body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else ''
        
        # Формируем event объект (как в Cloud Functions)
        event = {
            'httpMethod': self.command,
            'headers': dict(self.headers),
            'path': parsed.path,
            'queryStringParameters': parse_qs(parsed.query) if parsed.query else {},
            'body': body,
            'isBase64Encoded': False
        }
        
        # Создаем context объект-заглушку
        class Context:
            request_id = 'local-request'
            function_name = function_name
            function_version = '1.0'
            memory_limit_in_mb = 256
        
        try:
            # Вызываем функцию
            response = handler(event, Context())
            
            # Отправляем ответ
            status_code = response.get('statusCode', 200)
            headers = response.get('headers', {})
            body = response.get('body', '')
            
            self.send_response(status_code)
            for key, value in headers.items():
                self.send_header(key, value)
            self.end_headers()
            
            self.wfile.write(body.encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Function error: {str(e)}")
    
    def do_GET(self):
        self.handle_request()
    
    def do_POST(self):
        self.handle_request()
    
    def do_PUT(self):
        self.handle_request()
    
    def do_DELETE(self):
        self.handle_request()

def run_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), BackendHandler)
    print(f'Backend server running on port {port}')
    server.serve_forever()

if __name__ == '__main__':
    # Загружаем переменные окружения из .env
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    run_server()
```

### 4.3. Настройка переменных окружения для Backend

```bash
nano backend-server/.env
```

Содержимое `.env`:
```env
DATABASE_URL=postgresql://your_user:strong_password_here@localhost:5432/yandex_cleaning_serv
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
```

### 4.4. Установка зависимостей для Python функций

```bash
cd /var/www/yandex-cleaning

# Создаем виртуальное окружение
python3.11 -m venv venv
source venv/bin/activate

# Устанавливаем зависимости из всех requirements.txt
find backend -name "requirements.txt" -exec pip install -r {} \;

# Основные зависимости
pip install psycopg2-binary requests
```

### 4.5. Запуск backend сервера через PM2

```bash
# Создаем PM2 конфиг
nano backend-server/ecosystem.config.js
```

Содержимое `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'backend-api',
    script: '/var/www/yandex-cleaning/venv/bin/python',
    args: '/var/www/yandex-cleaning/backend-server/server.py',
    cwd: '/var/www/yandex-cleaning/backend-server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    }
  }]
};
```

Запускаем:
```bash
cd /var/www/yandex-cleaning/backend-server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Часть 5: Миграция базы данных

### 5.1. Применение миграций

```bash
cd /var/www/yandex-cleaning

# Устанавливаем psycopg2
source venv/bin/activate
pip install psycopg2-binary

# Создаем скрипт для миграций
nano migrate.py
```

Содержимое `migrate.py`:
```python
#!/usr/bin/env python3
import os
import psycopg2
from pathlib import Path

def run_migrations():
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    migrations_dir = Path('db_migrations')
    if not migrations_dir.exists():
        print("No migrations directory found")
        return
    
    # Сортируем файлы миграций
    migration_files = sorted(migrations_dir.glob('V*.sql'))
    
    for migration_file in migration_files:
        print(f"Running migration: {migration_file.name}")
        with open(migration_file) as f:
            sql = f.read()
            cur.execute(sql)
            conn.commit()
        print(f"✓ Completed: {migration_file.name}")
    
    cur.close()
    conn.close()
    print("All migrations completed!")

if __name__ == '__main__':
    run_migrations()
```

Запускаем:
```bash
export DATABASE_URL="postgresql://your_user:strong_password_here@localhost:5432/yandex_cleaning_serv"
python migrate.py
```

## Часть 6: Автоматическая синхронизация с poehali.dev

### 6.1. Настройка GitHub Webhook

```bash
# Создаем скрипт для обработки webhook
nano /var/www/yandex-cleaning/webhook-handler.sh
```

Содержимое `webhook-handler.sh`:
```bash
#!/bin/bash
set -e

echo "=== Starting deployment at $(date) ==="

cd /var/www/yandex-cleaning

# Сохраняем текущие изменения
git stash

# Получаем последние изменения
git pull origin main

# Восстанавливаем изменения если были
git stash pop || true

# Устанавливаем зависимости если изменился package.json
if git diff --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    echo "Installing npm dependencies..."
    npm install
fi

# Собираем frontend
echo "Building frontend..."
npm run build

# Перезагружаем Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Перезапускаем backend если изменились Python файлы
if git diff --name-only HEAD@{1} HEAD | grep -q "backend/.*\.py"; then
    echo "Restarting backend..."
    pm2 restart backend-api
fi

echo "=== Deployment completed at $(date) ==="
```

Делаем исполняемым:
```bash
chmod +x /var/www/yandex-cleaning/webhook-handler.sh
```

### 6.2. Установка и настройка webhook сервера

```bash
npm install -g webhook

# Создаем конфиг для webhook
nano /var/www/yandex-cleaning/webhook.json
```

Содержимое `webhook.json`:
```json
[
  {
    "id": "deploy",
    "execute-command": "/var/www/yandex-cleaning/webhook-handler.sh",
    "command-working-directory": "/var/www/yandex-cleaning",
    "response-message": "Deployment started",
    "trigger-rule": {
      "match": {
        "type": "payload-hmac-sha256",
        "secret": "YOUR_WEBHOOK_SECRET_HERE",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature-256"
        }
      }
    }
  }
]
```

Запускаем webhook через PM2:
```bash
pm2 start webhook --name github-webhook -- -hooks /var/www/yandex-cleaning/webhook.json -port 9000 -verbose
pm2 save
```

### 6.3. Настройка Nginx для webhook

```bash
sudo nano /etc/nginx/sites-available/yandex-cleaning
```

Добавьте в конфиг:
```nginx
    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:9000/hooks/deploy;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
```

Перезагружаем Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4. Настройка webhook в GitHub

1. Зайдите в настройки репозитория на GitHub
2. Settings → Webhooks → Add webhook
3. Payload URL: `https://your-domain.com/webhook`
4. Content type: `application/json`
5. Secret: `YOUR_WEBHOOK_SECRET_HERE` (тот же что в webhook.json)
6. Events: "Just the push event"
7. Active: ✓

## Часть 7: Обновление URL в Frontend

### 7.1. Замена URL в коде

```bash
cd /var/www/yandex-cleaning

# Создаем скрипт для замены URL
nano replace-urls.sh
```

Содержимое `replace-urls.sh`:
```bash
#!/bin/bash

# Заменяем все URL functions.poehali.dev на ваш домен
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i 's|https://functions.poehali.dev/[a-f0-9-]*|https://your-domain.com/backend|g' {} +

echo "URLs replaced!"
```

Запускаем:
```bash
chmod +x replace-urls.sh
./replace-urls.sh
```

### 7.2. Создание func2url.json для вашего домена

```bash
nano src/func2url.json
```

Содержимое:
```json
{
  "yandex-metrika-goals": "https://your-domain.com/backend/yandex-metrika-goals",
  "yandex-platform-stats": "https://your-domain.com/backend/yandex-platform-stats",
  "yandex-blocked-stats": "https://your-domain.com/backend/yandex-blocked-stats",
  "yandex-blocked-platforms": "https://your-domain.com/backend/yandex-blocked-platforms",
  "rsya-projects": "https://your-domain.com/backend/rsya-projects",
  "yandex-oauth": "https://your-domain.com/backend/yandex-oauth",
  "admin": "https://your-domain.com/backend/admin",
  "subscription": "https://your-domain.com/backend/subscription",
  "cluster-names": "https://your-domain.com/backend/cluster-names",
  "auth": "https://your-domain.com/backend/auth",
  "wordstat-collect": "https://your-domain.com/backend/wordstat-collect",
  "wordstat-regions": "https://your-domain.com/backend/wordstat-regions",
  "api": "https://your-domain.com/backend/api",
  "yandex-direct": "https://your-domain.com/backend/yandex-direct",
  "wordstat": "https://your-domain.com/backend/wordstat",
  "yandex-platforms": "https://your-domain.com/backend/yandex-platforms"
}
```

## Часть 8: Работа с проектом

### 8.1. Внесение изменений в poehali.dev

Теперь при любых изменениях в poehali.dev:
1. Изменения автоматически коммитятся в GitHub
2. GitHub отправляет webhook на ваш сервер
3. Сервер автоматически:
   - Скачивает новый код
   - Собирает frontend
   - Перезапускает backend (если нужно)
   - Обновляет сайт

### 8.2. Проверка статуса

```bash
# Статус PM2 процессов
pm2 status

# Логи backend
pm2 logs backend-api

# Логи webhook
pm2 logs github-webhook

# Статус Nginx
sudo systemctl status nginx

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
```

### 8.3. Ручное обновление

Если webhook не работает, обновляйте вручную:
```bash
cd /var/www/yandex-cleaning
./webhook-handler.sh
```

## Часть 9: Мониторинг и обслуживание

### 9.1. Настройка логирования

```bash
# Логи PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 9.2. Резервное копирование базы данных

```bash
nano /var/www/yandex-cleaning/backup-db.sh
```

Содержимое:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/yandex-cleaning"
mkdir -p $BACKUP_DIR

pg_dump -U your_user -d yandex_cleaning_serv > "$BACKUP_DIR/backup_$DATE.sql"

# Удаляем бэкапы старше 7 дней
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Добавляем в cron:
```bash
chmod +x /var/www/yandex-cleaning/backup-db.sh
crontab -e

# Добавляем строку (бэкап каждый день в 3:00)
0 3 * * * /var/www/yandex-cleaning/backup-db.sh
```

## Часть 10: Troubleshooting

### Проблема: Frontend не загружается
```bash
# Проверяем Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверяем права на файлы
sudo chown -R www-data:www-data /var/www/yandex-cleaning/dist
```

### Проблема: Backend не отвечает
```bash
# Проверяем статус
pm2 status backend-api

# Смотрим логи
pm2 logs backend-api --lines 100

# Перезапускаем
pm2 restart backend-api
```

### Проблема: Webhook не срабатывает
```bash
# Проверяем webhook процесс
pm2 logs github-webhook

# Проверяем доступность
curl -X POST https://your-domain.com/webhook

# Проверяем логи в GitHub (Settings → Webhooks → Recent Deliveries)
```

### Проблема: База данных не подключается
```bash
# Проверяем PostgreSQL
sudo systemctl status postgresql

# Тестируем подключение
psql -U your_user -d yandex_cleaning_serv -h localhost
```

## Итоговая структура проекта

```
/var/www/yandex-cleaning/
├── backend/                 # Backend функции
│   ├── auth/
│   ├── yandex-oauth/
│   └── ...
├── backend-server/          # API Gateway для backend
│   ├── server.py
│   ├── .env
│   └── ecosystem.config.js
├── src/                     # Frontend исходники
├── dist/                    # Собранный frontend
├── db_migrations/           # Миграции БД
├── webhook-handler.sh       # Скрипт автодеплоя
├── webhook.json             # Конфиг webhook
├── migrate.py               # Скрипт миграций
├── backup-db.sh             # Скрипт бэкапа
└── package.json
```

## Полезные команды

```bash
# Пересборка и деплой
cd /var/www/yandex-cleaning
npm run build
sudo systemctl reload nginx

# Просмотр всех процессов
pm2 list

# Рестарт всех процессов
pm2 restart all

# Мониторинг в реальном времени
pm2 monit

# Обновление из GitHub
git pull && npm install && npm run build && pm2 restart all

# Проверка портов
sudo netstat -tlnp | grep -E ':(80|443|8000|9000)'
```

---

## Поддержка

Если что-то не работает:
1. Проверьте логи: `pm2 logs`
2. Проверьте Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Проверьте PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
4. Проверьте права доступа: `ls -la /var/www/yandex-cleaning`

Успехов с деплоем! 🚀
