variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "app_name" {
  type = string
}

variable "storage_account_name" {
  type = string
}

variable "storage_account_access_key" {
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

# Consumption Plan (Serverless / Pay-as-you-go)
resource "azurerm_service_plan" "consumption_plan" {
  name                = "asp-${var.app_name}-api"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1" # Y1 is the Consumption SKU
}

resource "azurerm_linux_function_app" "api" {
  name                = var.app_name
  resource_group_name = var.resource_group_name
  location            = var.location

  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key
  service_plan_id            = azurerm_service_plan.consumption_plan.id

  site_config {
    application_stack {
      node_version = "24"
    }
  }

  app_settings = {
    "MONGODB_URI"                           = var.mongodb_uri
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.app_insights_instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_connection_string
  }
}
