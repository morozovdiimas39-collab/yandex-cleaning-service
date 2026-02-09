output "database_connection_string" {
  description = "Строка подключения к PostgreSQL"
  value       = "postgresql://${yandex_mdb_postgresql_user.main.name}:${var.db_password}@${yandex_mdb_postgresql_cluster.main.host[0].fqdn}:6432/${yandex_mdb_postgresql_database.main.name}"
  sensitive   = true
}

output "database_host" {
  description = "Хост PostgreSQL"
  value       = yandex_mdb_postgresql_cluster.main.host[0].fqdn
}

output "message_queue_url" {
  description = "URL Message Queue"
  value       = yandex_message_queue.batches.id
}

output "storage_bucket_name" {
  description = "Имя S3 бакета"
  value       = yandex_storage_bucket.files.bucket
}

output "storage_bucket_website" {
  description = "URL сайта на Object Storage"
  value       = "https://${yandex_storage_bucket.files.bucket}.website.yandexcloud.net"
}

output "storage_access_key" {
  description = "Access Key для S3"
  value       = yandex_iam_service_account_static_access_key.storage.access_key
  sensitive   = true
}

output "storage_secret_key" {
  description = "Secret Key для S3"
  value       = yandex_iam_service_account_static_access_key.storage.secret_key
  sensitive   = true
}

output "function_urls" {
  description = "URLs всех Cloud Functions"
  value = {
    for name, func in yandex_function.functions :
    name => "https://functions.yandexcloud.net/${func.id}"
  }
}

output "lockbox_secret_id" {
  description = "ID секрета в Lockbox"
  value       = yandex_lockbox_secret.main.id
}

output "service_account_functions_id" {
  description = "ID сервисного аккаунта для функций"
  value       = yandex_iam_service_account.functions.id
}

output "deployment_summary" {
  description = "Сводка по развёртыванию"
  value = <<-EOT
    
    ✅ Инфраструктура развёрнута!
    
    🗄️  PostgreSQL Database:
       Host: ${yandex_mdb_postgresql_cluster.main.host[0].fqdn}
       Port: 6432
       Database: ${yandex_mdb_postgresql_database.main.name}
       User: ${yandex_mdb_postgresql_user.main.name}
    
    📦 Message Queue:
       URL: ${yandex_message_queue.batches.id}
    
    🪣 S3 Bucket:
       Name: ${yandex_storage_bucket.files.bucket}
       Website: https://${yandex_storage_bucket.files.bucket}.website.yandexcloud.net
    
    ⚡ Cloud Functions: ${length(local.functions)} deployed
    
    🔐 Secrets: Stored in Lockbox (ID: ${yandex_lockbox_secret.main.id})
    
    📋 Triggers:
       - rsya-scheduler: CRON каждый час
       - rsya-async-poller: CRON каждые 5 минут
       - rsya-batch-worker: Message Queue триггер
    
    🌐 Следующие шаги:
       1. Обнови func2url.json с новыми URLs функций
       2. Пересобери фронтенд с новыми URLs
       3. Открой сайт: https://${yandex_storage_bucket.files.bucket}.website.yandexcloud.net
    
  EOT
}

# Вывод в JSON формате для автоматизации
output "func2url_json" {
  description = "Маппинг функций в формате JSON для func2url.json"
  value = jsonencode({
    for name, func in yandex_function.functions :
    name => "https://functions.yandexcloud.net/${func.id}"
  })
}
