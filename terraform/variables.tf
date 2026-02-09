# ===== Yandex Cloud Configuration =====
variable "yandex_token" {
  description = "OAuth токен для Yandex Cloud (получите через yc iam create-token)"
  type        = string
  sensitive   = true
}

variable "yandex_cloud_id" {
  description = "ID облака Yandex Cloud"
  type        = string
}

variable "yandex_folder_id" {
  description = "ID каталога (folder) в Yandex Cloud"
  type        = string
}

variable "yandex_zone" {
  description = "Зона доступности Yandex Cloud"
  type        = string
  default     = "ru-central1-a"
}

variable "project_name" {
  description = "Имя проекта (используется в названиях ресурсов)"
  type        = string
  default     = "rsya-automation"
}

# ===== Database Configuration =====
variable "db_password" {
  description = "Пароль для пользователя PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_version" {
  description = "Версия PostgreSQL"
  type        = string
  default     = "14"
}

variable "db_disk_size" {
  description = "Размер диска для БД в GB"
  type        = number
  default     = 20
}

# ===== API Keys and Secrets =====
variable "yandex_direct_client_id" {
  description = "Client ID для Яндекс.Директ OAuth"
  type        = string
  sensitive   = true
}

variable "yandex_direct_client_secret" {
  description = "Client Secret для Яндекс.Директ OAuth"
  type        = string
  sensitive   = true
}

variable "yandex_metrika_oauth_client_id" {
  description = "Client ID для Яндекс.Метрика OAuth"
  type        = string
  sensitive   = true
}

variable "yandex_metrika_oauth_client_secret" {
  description = "Client Secret для Яндекс.Метрика OAuth"
  type        = string
  sensitive   = true
}

variable "yandex_wordstat_token" {
  description = "OAuth токен для Yandex Wordstat API"
  type        = string
  sensitive   = true
}

variable "yookassa_shop_id" {
  description = "Shop ID магазина ЮКасса"
  type        = string
  sensitive   = true
}

variable "yookassa_secret_key" {
  description = "Секретный ключ ЮКасса для API"
  type        = string
  sensitive   = true
}

variable "telegram_bot_token" {
  description = "Token бота Telegram"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "API ключ OpenAI для кластеризации"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_proxy_url" {
  description = "HTTP/HTTPS прокси для OpenAI API"
  type        = string
  default     = ""
}

variable "gemini_api_key" {
  description = "API ключ Google Gemini для AI агента"
  type        = string
  sensitive   = true
  default     = ""
}

variable "gemini_proxy_url" {
  description = "HTTP/HTTPS прокси для Gemini API"
  type        = string
  default     = ""
}

variable "alfabank_gateway_id" {
  description = "Terminal ID (Gateway ID) Альфа-Банк"
  type        = string
  default     = ""
}

variable "alfabank_login" {
  description = "Логин для API Альфа-Банк"
  type        = string
  default     = ""
}

variable "alfabank_password" {
  description = "Пароль для API Альфа-Банк"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_sheets_credentials" {
  description = "JSON-ключ сервисного аккаунта Google Cloud для Google Sheets API"
  type        = string
  sensitive   = true
  default     = ""
}

# ===== Optional Settings =====
variable "enable_frontend_deploy" {
  description = "Автоматически деплоить фронтенд в S3"
  type        = bool
  default     = true
}

variable "custom_domain" {
  description = "Кастомный домен для сайта (опционально)"
  type        = string
  default     = ""
}

variable "network_id" {
  description = "ID существующей VPC сети (если пусто - создастся новая)"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "ID существующей подсети (если пусто - создастся новая)"
  type        = string
  default     = ""
}
