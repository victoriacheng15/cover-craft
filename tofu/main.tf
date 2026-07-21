terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.21"
    }
  }
  backend "azurerm" {
    resource_group_name  = "projects-rg"
    storage_account_name = "stcovercraftcan"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}

# Variables
variable "resource_group_name" {
  type    = string
  default = "projects-rg"
}

variable "location" {
  type    = string
  default = "canadacentral"
}

variable "app_name" {
  type    = string
  default = "cover-craft"
}

variable "mongodb_uri" {
  type      = string
  sensitive = true
}

locals {
  tags = {
    project = var.app_name
  }
}

provider "azurerm" {
  features {}
}

# Data source for existing resource group (Frontend)
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

# New Resource Group for the API (to avoid Mixed-Mode SKU conflicts in the same group)
resource "azurerm_resource_group" "api" {
  name     = "${var.resource_group_name}-api"
  location = var.location
  tags     = local.tags
}

# 1. Storage Account Module
module "storage" {
  source              = "./modules/storage"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
  tags                = local.tags
}

# 2. Application Insights Module
module "application_insights" {
  source              = "./modules/application_insights"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
  tags                = local.tags
}

# 3. Function App Module (API)
module "function_app" {
  source                           = "./modules/function_app"
  resource_group_name              = azurerm_resource_group.api.name
  location                         = var.location
  app_name                         = var.app_name
  storage_account_id               = module.storage.id
  storage_account_name             = module.storage.name
  storage_account_access_key       = module.storage.primary_access_key
  storage_container_endpoint       = module.storage.primary_blob_endpoint
  mongodb_uri                      = var.mongodb_uri
  app_insights_connection_string   = module.application_insights.connection_string
  app_insights_instrumentation_key = module.application_insights.instrumentation_key
  tags                             = local.tags
}

data "azurerm_function_app_host_keys" "api" {
  name                = var.app_name
  resource_group_name = azurerm_resource_group.api.name

  depends_on = [module.function_app]
}

# 4. App Service Module (Plan & Frontend)
module "app_service" {
  source              = "./modules/app_service"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
  azure_function_key  = data.azurerm_function_app_host_keys.api.default_function_key
  tags                = local.tags
}

# Temporary Go Backend Infrastructure (Consumption Plan Y1 + Linux Custom Runtime App)
resource "azurerm_service_plan" "go_plan" {
  name                = "asp-${var.app_name}-go"
  resource_group_name = azurerm_resource_group.api.name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = local.tags
}

resource "azurerm_linux_function_app" "go_api" {
  name                = "${var.app_name}-go-api"
  resource_group_name = azurerm_resource_group.api.name
  location            = var.location

  service_plan_id            = azurerm_service_plan.go_plan.id
  storage_account_name       = module.storage.name
  storage_account_access_key = module.storage.primary_access_key

  site_config {
    application_stack {
      use_custom_runtime = true
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"              = "custom"
    "MONGODB_URI"                           = var.mongodb_uri
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = module.application_insights.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = module.application_insights.connection_string
  }

  tags = local.tags
}

data "azurerm_function_app_host_keys" "go_api" {
  name                = azurerm_linux_function_app.go_api.name
  resource_group_name = azurerm_resource_group.api.name

  depends_on = [azurerm_linux_function_app.go_api]
}

# Go API Output Endpoints for Testing
output "go_api_url" {
  value       = "https://${azurerm_linux_function_app.go_api.default_hostname}"
  description = "The default hostname of the Go Custom Handler Function App"
}

output "go_api_default_key" {
  value       = data.azurerm_function_app_host_keys.go_api.default_function_key
  sensitive   = true
  description = "The default host key of the Go Custom Handler Function App"
}

