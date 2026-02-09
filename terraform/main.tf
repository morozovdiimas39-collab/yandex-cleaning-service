# ===== VPC Network =====
resource "yandex_vpc_network" "main" {
  count = var.network_id == "" ? 1 : 0
  name  = "${var.project_name}-network"
}

resource "yandex_vpc_subnet" "main" {
  count          = var.subnet_id == "" ? 1 : 0
  name           = "${var.project_name}-subnet"
  zone           = var.yandex_zone
  network_id     = var.network_id != "" ? var.network_id : yandex_vpc_network.main[0].id
  v4_cidr_blocks = ["10.128.0.0/24"]
}

locals {
  network_id = var.network_id != "" ? var.network_id : yandex_vpc_network.main[0].id
  subnet_id  = var.subnet_id != "" ? var.subnet_id : yandex_vpc_subnet.main[0].id
}

# ===== PostgreSQL Database =====
resource "yandex_mdb_postgresql_cluster" "main" {
  name        = "${var.project_name}-db"
  environment = "PRODUCTION"
  network_id  = local.network_id

  config {
    version = var.db_version
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-ssd"
      disk_size          = var.db_disk_size
    }
  }

  host {
    zone      = var.yandex_zone
    subnet_id = local.subnet_id
    assign_public_ip = true
  }
}

resource "yandex_mdb_postgresql_database" "main" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = var.project_name
  owner      = yandex_mdb_postgresql_user.main.name
}

resource "yandex_mdb_postgresql_user" "main" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = "admin"
  password   = var.db_password
}

# ===== Message Queue =====
resource "yandex_message_queue" "batches" {
  name                       = "${var.project_name}-batches"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 1209600
  access_key                 = yandex_iam_service_account_static_access_key.mq.access_key
  secret_key                 = yandex_iam_service_account_static_access_key.mq.secret_key
}

# ===== S3 Bucket =====
resource "yandex_storage_bucket" "files" {
  access_key = yandex_iam_service_account_static_access_key.storage.access_key
  secret_key = yandex_iam_service_account_static_access_key.storage.secret_key
  bucket     = "${var.project_name}-files-${random_string.bucket_suffix.result}"
  acl        = "public-read"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ===== Service Accounts =====
resource "yandex_iam_service_account" "functions" {
  name        = "${var.project_name}-functions"
  description = "Сервисный аккаунт для Cloud Functions"
}

resource "yandex_iam_service_account" "storage" {
  name        = "${var.project_name}-storage"
  description = "Сервисный аккаунт для Object Storage"
}

resource "yandex_iam_service_account" "mq" {
  name        = "${var.project_name}-mq"
  description = "Сервисный аккаунт для Message Queue"
}

# ===== IAM Roles =====
resource "yandex_resourcemanager_folder_iam_member" "functions_invoker" {
  folder_id = var.yandex_folder_id
  role      = "serverless.functions.invoker"
  member    = "serviceAccount:${yandex_iam_service_account.functions.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "lockbox_viewer" {
  folder_id = var.yandex_folder_id
  role      = "lockbox.payloadViewer"
  member    = "serviceAccount:${yandex_iam_service_account.functions.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "mq_reader" {
  folder_id = var.yandex_folder_id
  role      = "ymq.reader"
  member    = "serviceAccount:${yandex_iam_service_account.functions.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "mq_writer" {
  folder_id = var.yandex_folder_id
  role      = "ymq.writer"
  member    = "serviceAccount:${yandex_iam_service_account.functions.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "storage_admin" {
  folder_id = var.yandex_folder_id
  role      = "storage.admin"
  member    = "serviceAccount:${yandex_iam_service_account.storage.id}"
}

# ===== Static Access Keys =====
resource "yandex_iam_service_account_static_access_key" "storage" {
  service_account_id = yandex_iam_service_account.storage.id
  description        = "Static key for Object Storage"
}

resource "yandex_iam_service_account_static_access_key" "mq" {
  service_account_id = yandex_iam_service_account.mq.id
  description        = "Static key for Message Queue"
}

# ===== Lockbox Secrets =====
resource "yandex_lockbox_secret" "main" {
  name        = "${var.project_name}-secrets"
  description = "Секреты проекта"
}

resource "yandex_lockbox_secret_version" "main" {
  secret_id = yandex_lockbox_secret.main.id

  entries {
    key        = "DATABASE_URL"
    text_value = "postgresql://${yandex_mdb_postgresql_user.main.name}:${var.db_password}@${yandex_mdb_postgresql_cluster.main.host[0].fqdn}:6432/${yandex_mdb_postgresql_database.main.name}"
  }

  entries {
    key        = "MAIN_DB_SCHEMA"
    text_value = "public"
  }

  entries {
    key        = "AWS_ACCESS_KEY_ID"
    text_value = yandex_iam_service_account_static_access_key.storage.access_key
  }

  entries {
    key        = "AWS_SECRET_ACCESS_KEY"
    text_value = yandex_iam_service_account_static_access_key.storage.secret_key
  }

  entries {
    key        = "YANDEX_MQ_ACCESS_KEY_ID"
    text_value = yandex_iam_service_account_static_access_key.mq.access_key
  }

  entries {
    key        = "YANDEX_MQ_SECRET_KEY"
    text_value = yandex_iam_service_account_static_access_key.mq.secret_key
  }

  entries {
    key        = "MESSAGE_QUEUE_URL"
    text_value = yandex_message_queue.batches.id
  }

  entries {
    key        = "PROJECT_ID"
    text_value = var.project_name
  }

  entries {
    key        = "YANDEX_DIRECT_CLIENT_ID"
    text_value = var.yandex_direct_client_id
  }

  entries {
    key        = "YANDEX_DIRECT_CLIENT_SECRET"
    text_value = var.yandex_direct_client_secret
  }

  entries {
    key        = "YANDEX_METRIKA_OAUTH_CLIENT_ID"
    text_value = var.yandex_metrika_oauth_client_id
  }

  entries {
    key        = "YANDEX_METRIKA_OAUTH_CLIENT_SECRET"
    text_value = var.yandex_metrika_oauth_client_secret
  }

  entries {
    key        = "YANDEX_WORDSTAT_TOKEN"
    text_value = var.yandex_wordstat_token
  }

  entries {
    key        = "YOOKASSA_SHOP_ID"
    text_value = var.yookassa_shop_id
  }

  entries {
    key        = "YOOKASSA_SECRET_KEY"
    text_value = var.yookassa_secret_key
  }

  entries {
    key        = "TELEGRAM_BOT_TOKEN"
    text_value = var.telegram_bot_token
  }

  dynamic "entries" {
    for_each = var.openai_api_key != "" ? [1] : []
    content {
      key        = "OPENAI_API_KEY"
      text_value = var.openai_api_key
    }
  }

  dynamic "entries" {
    for_each = var.openai_proxy_url != "" ? [1] : []
    content {
      key        = "OPENAI_PROXY_URL"
      text_value = var.openai_proxy_url
    }
  }

  dynamic "entries" {
    for_each = var.gemini_api_key != "" ? [1] : []
    content {
      key        = "GEMINI_API_KEY"
      text_value = var.gemini_api_key
    }
  }

  dynamic "entries" {
    for_each = var.gemini_proxy_url != "" ? [1] : []
    content {
      key        = "GEMINI_PROXY_URL"
      text_value = var.gemini_proxy_url
    }
  }

  dynamic "entries" {
    for_each = var.alfabank_gateway_id != "" ? [1] : []
    content {
      key        = "ALFABANK_GATEWAY_ID"
      text_value = var.alfabank_gateway_id
    }
  }

  dynamic "entries" {
    for_each = var.alfabank_login != "" ? [1] : []
    content {
      key        = "ALFABANK_LOGIN"
      text_value = var.alfabank_login
    }
  }

  dynamic "entries" {
    for_each = var.alfabank_password != "" ? [1] : []
    content {
      key        = "ALFABANK_PASSWORD"
      text_value = var.alfabank_password
    }
  }

  dynamic "entries" {
    for_each = var.google_sheets_credentials != "" ? [1] : []
    content {
      key        = "GOOGLE_SHEETS_CREDENTIALS"
      text_value = var.google_sheets_credentials
    }
  }
}

# ===== Cloud Functions =====
locals {
  functions = [
    "admin",
    "api",
    "fetch-git-file",
    "rsya-async-poller",
    "rsya-automation",
    "rsya-batch-worker",
    "rsya-block-worker",
    "rsya-health",
    "rsya-projects",
    "rsya-rotation",
    "rsya-scheduler",
    "save-git-file",
    "subscription",
    "telega-button-handler",
    "telega-crm",
    "telega-lead-webhook",
    "telega-start-handler",
    "wordstat-parser",
    "wordstat-status",
    "yandex-blocked-platforms",
    "yandex-direct",
    "yandex-metrika-oauth",
    "yandex-oauth",
    "yandex-regions",
    "yookassa-payment",
    "yookassa-webhook"
  ]
}

# Archive each function
data "archive_file" "functions" {
  for_each = toset(local.functions)

  type        = "zip"
  source_dir  = "${path.module}/../backend/${each.key}"
  output_path = "${path.module}/.terraform/tmp/${each.key}.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "tests.json"]
}

# Create Cloud Functions
resource "yandex_function" "functions" {
  for_each = toset(local.functions)

  name               = each.key
  runtime            = "python311"
  entrypoint         = "index.handler"
  memory             = 256
  execution_timeout  = "30"
  service_account_id = yandex_iam_service_account.functions.id

  content {
    zip_filename = data.archive_file.functions[each.key].output_path
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "DATABASE_URL"
    environment_variable = "DATABASE_URL"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "MAIN_DB_SCHEMA"
    environment_variable = "MAIN_DB_SCHEMA"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "AWS_ACCESS_KEY_ID"
    environment_variable = "AWS_ACCESS_KEY_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "AWS_SECRET_ACCESS_KEY"
    environment_variable = "AWS_SECRET_ACCESS_KEY"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_MQ_ACCESS_KEY_ID"
    environment_variable = "YANDEX_MQ_ACCESS_KEY_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_MQ_SECRET_KEY"
    environment_variable = "YANDEX_MQ_SECRET_KEY"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "MESSAGE_QUEUE_URL"
    environment_variable = "MESSAGE_QUEUE_URL"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "PROJECT_ID"
    environment_variable = "PROJECT_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_DIRECT_CLIENT_ID"
    environment_variable = "YANDEX_DIRECT_CLIENT_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_DIRECT_CLIENT_SECRET"
    environment_variable = "YANDEX_DIRECT_CLIENT_SECRET"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_METRIKA_OAUTH_CLIENT_ID"
    environment_variable = "YANDEX_METRIKA_OAUTH_CLIENT_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_METRIKA_OAUTH_CLIENT_SECRET"
    environment_variable = "YANDEX_METRIKA_OAUTH_CLIENT_SECRET"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YANDEX_WORDSTAT_TOKEN"
    environment_variable = "YANDEX_WORDSTAT_TOKEN"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YOOKASSA_SHOP_ID"
    environment_variable = "YOOKASSA_SHOP_ID"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "YOOKASSA_SECRET_KEY"
    environment_variable = "YOOKASSA_SECRET_KEY"
  }

  secrets {
    id                   = yandex_lockbox_secret.main.id
    version_id           = yandex_lockbox_secret_version.main.id
    key                  = "TELEGRAM_BOT_TOKEN"
    environment_variable = "TELEGRAM_BOT_TOKEN"
  }

  depends_on = [
    yandex_resourcemanager_folder_iam_member.functions_invoker,
    yandex_resourcemanager_folder_iam_member.lockbox_viewer
  ]
}

# Make functions public
resource "yandex_function_iam_binding" "function_public" {
  for_each = toset(local.functions)

  function_id = yandex_function.functions[each.key].id
  role        = "serverless.functions.invoker"
  members     = ["system:allUsers"]
}

# ===== Triggers =====

# CRON: rsya-scheduler (every hour)
resource "yandex_function_trigger" "rsya_scheduler" {
  name        = "rsya-scheduler-hourly"
  description = "Запускает rsya-scheduler каждый час"

  timer {
    cron_expression = "0 * ? * * *"
  }

  function {
    id                 = yandex_function.functions["rsya-scheduler"].id
    service_account_id = yandex_iam_service_account.functions.id
  }
}

# CRON: rsya-async-poller (every 5 minutes)
resource "yandex_function_trigger" "rsya_poller" {
  name        = "rsya-poller-5min"
  description = "Запускает rsya-async-poller каждые 5 минут"

  timer {
    cron_expression = "*/5 * ? * * *"
  }

  function {
    id                 = yandex_function.functions["rsya-async-poller"].id
    service_account_id = yandex_iam_service_account.functions.id
  }
}

# Message Queue: rsya-batch-worker
resource "yandex_function_trigger" "rsya_batch_worker" {
  name        = "rsya-batch-queue-trigger"
  description = "Обрабатывает сообщения из очереди батчей"

  message_queue {
    queue_id           = yandex_message_queue.batches.arn
    service_account_id = yandex_iam_service_account.mq.id
    batch_size         = 1
    batch_cutoff       = 10
  }

  function {
    id                 = yandex_function.functions["rsya-batch-worker"].id
    service_account_id = yandex_iam_service_account.functions.id
  }

  depends_on = [
    yandex_resourcemanager_folder_iam_member.mq_reader
  ]
}

# ===== Database Migration =====
resource "null_resource" "db_migrations" {
  triggers = {
    db_host = yandex_mdb_postgresql_cluster.main.host[0].fqdn
  }

  provisioner "local-exec" {
    command = <<-EOT
      for file in $(ls -v ../db_migrations/*.sql); do
        echo "Applying migration: $file"
        PGPASSWORD="${var.db_password}" psql \
          "host=${yandex_mdb_postgresql_cluster.main.host[0].fqdn} \
           port=6432 \
           dbname=${yandex_mdb_postgresql_database.main.name} \
           user=${yandex_mdb_postgresql_user.main.name} \
           sslmode=require" \
          -f "$file" || exit 1
      done
    EOT
  }

  depends_on = [
    yandex_mdb_postgresql_database.main,
    yandex_mdb_postgresql_user.main
  ]
}

# ===== Frontend Deployment (Optional) =====
resource "null_resource" "frontend_build" {
  count = var.enable_frontend_deploy ? 1 : 0

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ..
      npm install
      npm run build
    EOT
  }
}

resource "null_resource" "frontend_deploy" {
  count = var.enable_frontend_deploy ? 1 : 0

  triggers = {
    bucket_id = yandex_storage_bucket.files.id
    build_id  = null_resource.frontend_build[0].id
  }

  provisioner "local-exec" {
    command = <<-EOT
      export AWS_ACCESS_KEY_ID="${yandex_iam_service_account_static_access_key.storage.access_key}"
      export AWS_SECRET_ACCESS_KEY="${yandex_iam_service_account_static_access_key.storage.secret_key}"
      aws s3 sync ../dist/ s3://${yandex_storage_bucket.files.bucket}/ \
        --endpoint-url=https://storage.yandexcloud.net \
        --acl public-read
    EOT
  }

  depends_on = [
    null_resource.frontend_build,
    yandex_storage_bucket.files
  ]
}
