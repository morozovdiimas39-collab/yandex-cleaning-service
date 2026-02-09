# Terraform Development Guide для rsya-automation

Эта конфигурация автоматически разворачивает всю инфраструктуру проекта в Yandex Cloud.

## Что будет создано

### Инфраструктура:
- ✅ **PostgreSQL кластер** с автоматическим применением всех миграций
- ✅ **Message Queue** для фоновой обработки батчей
- ✅ **S3 бакет** для файлов + Website Hosting
- ✅ **Lockbox** с секретами
- ✅ **VPC сеть и подсеть** (если ещё нет)
- ✅ **Сервисные аккаунты** с правами доступа

### Cloud Functions (26 штук):
- ✅ Автоматическая упаковка из `/backend/*`
- ✅ Публичный HTTP доступ
- ✅ Подключение всех секретов

### Триггеры:
- ✅ **rsya-scheduler** — CRON каждый час
- ✅ **rsya-async-poller** — CRON каждые 5 минут
- ✅ **rsya-batch-worker** — Message Queue триггер

### Автоматизация:
- ✅ Сборка фронтенда (`npm run build`)
- ✅ Загрузка в S3 с Website Hosting

---

## Требования

### 1. Установите Terraform

**macOS:**
```bash
brew install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform version
```

**Windows:**
```powershell
choco install terraform
```

### 2. Установите Yandex Cloud CLI

**macOS / Linux:**
```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
exec -l $SHELL
```

**Windows:**
```powershell
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')
```

### 3. Авторизуйтесь в Yandex Cloud

```bash
yc init
```

Выберите:
- Облако (cloud)
- Каталог (folder)
- Зону доступности (ru-central1-a)

### 4. Установите AWS CLI (для загрузки фронтенда в S3)

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
sudo apt-get install awscli
```

**Windows:**
Скачайте с https://aws.amazon.com/cli/

### 5. Установите PostgreSQL клиент (для миграций)

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

---

## Быстрый старт

### Шаг 1: Подготовьте переменные

```bash
# Скопируйте шаблон
cp terraform.tfvars.example terraform.tfvars

# Отредактируйте файл
nano terraform.tfvars
```

Заполните **обязательные** поля:
- `yandex_token` — получите через `yc iam create-token`
- `yandex_cloud_id` — из `yc config list`
- `yandex_folder_id` — из `yc config list`
- `db_password` — придумайте надёжный пароль
- API ключи для Яндекс.Директ, Метрики, Wordstat
- `yookassa_shop_id` и `yookassa_secret_key`
- `telegram_bot_token`

### Шаг 2: Инициализируйте Terraform

```bash
cd terraform
terraform init
```

### Шаг 3: Проверьте план развёртывания

```bash
terraform plan
```

Terraform покажет что будет создано (~50 ресурсов).

### Шаг 4: Разверните инфраструктуру

```bash
terraform apply
```

Введите `yes` для подтверждения. Процесс займёт **5-10 минут**.

### Шаг 5: Получите результаты

После завершения Terraform выведет:
- URLs всех функций
- Данные для подключения к БД
- URL сайта на Object Storage
- Маппинг функций в формате JSON

```bash
# Посмотреть все outputs
terraform output

# Получить JSON для func2url.json
terraform output -json func2url_json
```

---

## Обновление инфраструктуры

### Обновить код функций

```bash
# После изменений в /backend/*
terraform apply
```

Terraform автоматически:
1. Пересоздаст ZIP архивы
2. Обновит версии функций
3. Применит изменения

### Обновить фронтенд

```bash
# Пересобрать и загрузить
terraform taint null_resource.frontend_build[0]
terraform taint null_resource.frontend_deploy[0]
terraform apply
```

### Обновить переменные (секреты)

```bash
# Отредактируйте terraform.tfvars
nano terraform.tfvars

# Примените изменения
terraform apply
```

Terraform обновит только секреты в Lockbox, функции перезапускать не нужно.

---

## Полезные команды

### Посмотреть URLs функций
```bash
terraform output function_urls
```

### Посмотреть DATABASE_URL
```bash
terraform output database_connection_string
```

### Подключиться к базе
```bash
# Получите данные
DB_HOST=$(terraform output -raw database_host)
DB_PASS=$(terraform output -raw db_password)

# Подключитесь
psql "host=$DB_HOST port=6432 dbname=rsya-automation user=admin password=$DB_PASS sslmode=require"
```

### Посмотреть логи функции
```bash
yc serverless function logs --function-name=rsya-scheduler --limit=50
```

### Вызвать функцию вручную
```bash
yc serverless function invoke --name=rsya-scheduler
```

### Проверить триггеры
```bash
yc serverless trigger list
```

---

## Удаление инфраструктуры

**⚠️ ВНИМАНИЕ: Это удалит ВСЁ включая БД!**

```bash
terraform destroy
```

Введите `yes` для подтверждения.

---

## Структура файлов

```
terraform/
├── main.tf                    # Основная конфигурация
├── variables.tf               # Определения переменных
├── outputs.tf                 # Выходные данные
├── versions.tf                # Версии провайдеров
├── terraform.tfvars.example   # Шаблон переменных
├── terraform.tfvars           # Ваши секреты (НЕ коммитить!)
└── README.md                  # Эта инструкция
```

---

## Troubleshooting

### Ошибка: "Error creating PostgreSQL cluster"

**Проблема:** Недостаточно квоты на диски.

**Решение:**
```bash
# Запросите увеличение квоты в консоли Yandex Cloud
# Или уменьшите db_disk_size в terraform.tfvars
db_disk_size = 10
```

### Ошибка: "psql: command not found"

**Проблема:** Не установлен PostgreSQL клиент.

**Решение:**
```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

### Ошибка: "AWS CLI not found"

**Проблема:** AWS CLI не установлен (нужен для загрузки в S3).

**Решение:**
```bash
# macOS
brew install awscli

# Linux
sudo apt-get install awscli
```

### Фронтенд не загружается в S3

**Решение:**
```bash
# Отключите автоматический деплой
enable_frontend_deploy = false

# Загрузите вручную
cd ..
npm run build
export AWS_ACCESS_KEY_ID=$(terraform output -raw storage_access_key)
export AWS_SECRET_ACCESS_KEY=$(terraform output -raw storage_secret_key)
aws s3 sync dist/ s3://$(terraform output -raw storage_bucket_name)/ \
  --endpoint-url=https://storage.yandexcloud.net \
  --acl public-read
```

### Миграции не применяются

**Решение:**
```bash
# Примените вручную
DB_HOST=$(terraform output -raw database_host)
DB_PASS=<your-db-password>

for file in $(ls -v ../db_migrations/*.sql); do
  echo "Applying: $file"
  PGPASSWORD="$DB_PASS" psql \
    "host=$DB_HOST port=6432 dbname=rsya-automation user=admin sslmode=require" \
    -f "$file"
done
```

---

## Безопасность

### Важно:

1. **НЕ коммитьте `terraform.tfvars`** — добавлен в `.gitignore`
2. **НЕ шарьте outputs** — они содержат пароли и ключи
3. **Используйте `.terraform.lock.hcl`** — коммитьте для версионирования
4. **Храните state в S3** (опционально для продакшн):

```hcl
# Добавьте в versions.tf
terraform {
  backend "s3" {
    endpoint = "storage.yandexcloud.net"
    bucket   = "terraform-state-bucket"
    key      = "rsya-automation/terraform.tfstate"
    region   = "ru-central1"
    skip_region_validation      = true
    skip_credentials_validation = true
  }
}
```

---

## Стоимость

**Примерная стоимость при средней нагрузке:**

- PostgreSQL (s2.micro, 20GB SSD): ~1500₽/мес
- Cloud Functions (26 штук, ~1M запросов/мес): ~500₽/мес
- Message Queue (~100K сообщений/мес): ~50₽/мес
- Object Storage (10GB): ~20₽/мес
- Lockbox: Бесплатно до 100 секретов

**Итого: ~2000₽/месяц**

---

## Поддержка

Если что-то не работает:
1. Проверьте `terraform.tfvars` — все ли поля заполнены?
2. Посмотрите логи: `yc serverless function logs --name=<function-name>`
3. Проверьте права: `yc iam service-account list-access-bindings <SA_ID>`

Хочешь, я добавлю автоматическое обновление `func2url.json` после деплоя?
