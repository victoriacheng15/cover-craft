variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "app_name" {
  type = string
}

variable "storage_account_id" {
  type = string
}

variable "storage_account_name" {
  type = string
}

variable "storage_account_access_key" {
  type = string
}

variable "storage_container_endpoint" {
  type = string
}

variable "mongodb_uri" {
  type = string
}

variable "app_insights_connection_string" {
  type = string
}

variable "app_insights_instrumentation_key" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

# 1. Storage Container for Flex Consumption Deployment
resource "azurerm_storage_container" "deploy" {
  name                  = "app-package"
  storage_account_id    = var.storage_account_id
  container_access_type = "private"
}

# 2. Flex Consumption Plan (FC1)
resource "azurerm_service_plan" "flex_plan" {
  name                = "asp-${var.app_name}-api"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "FC1"
  tags                = var.tags
}

# 3. Flex Consumption Function App
# Using the stable top-level attributes for azurerm v4.x
resource "azurerm_function_app_flex_consumption" "api" {
  name                = var.app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.flex_plan.id

  instance_memory_in_mb = 2048

  runtime_name    = "node"
  runtime_version = "22"

  storage_container_type      = "blobContainer"
  storage_container_endpoint  = "${var.storage_container_endpoint}${azurerm_storage_container.deploy.name}"
  storage_authentication_type = "StorageAccountConnectionString"
  storage_access_key          = var.storage_account_access_key

  site_config {
    app_service_logs {
      disk_quota_mb         = 35
      retention_period_days = 7
    }
  }

  app_settings = {
    "MONGODB_URI"                           = var.mongodb_uri
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.app_insights_instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_connection_string
  }
}

# Go API Plan (Consumption Y1)
resource "azurerm_service_plan" "go_plan" {
  name                = "asp-${var.app_name}-go"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = var.tags
}

# Go Function App (Custom Runtime)
resource "azurerm_linux_function_app" "go_api" {
  name                = "${var.app_name}-go-api"
  resource_group_name = var.resource_group_name
  location            = var.location

  service_plan_id            = azurerm_service_plan.go_plan.id
  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key

  site_config {
    application_stack {
      use_custom_runtime = true
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"              = "custom"
    "MONGODB_URI"                           = var.mongodb_uri
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.app_insights_instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_connection_string
  }

  tags = var.tags
}

# Host Keys for Legacy API
data "azurerm_function_app_host_keys" "api" {
  name                = azurerm_function_app_flex_consumption.api.name
  resource_group_name = var.resource_group_name

  depends_on = [azurerm_function_app_flex_consumption.api]
}

# Host Keys for Go API
data "azurerm_function_app_host_keys" "go_api" {
  name                = azurerm_linux_function_app.go_api.name
  resource_group_name = var.resource_group_name

  depends_on = [azurerm_linux_function_app.go_api]
}

# Outputs
output "default_function_key" {
  value     = data.azurerm_function_app_host_keys.api.default_function_key
  sensitive = true
}

output "go_api_url" {
  value = "https://${azurerm_linux_function_app.go_api.default_hostname}"
}

output "go_api_default_key" {
  value     = data.azurerm_function_app_host_keys.go_api.default_function_key
  sensitive = true
}
