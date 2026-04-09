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

provider "azurerm" {
  features {}
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

# Data source for existing resource group (Frontend)
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

# New Resource Group for the API (to avoid Mixed-Mode SKU conflicts in the same group)
resource "azurerm_resource_group" "api" {
  name     = "${var.resource_group_name}-api"
  location = var.location
}

# 1. Storage Account Module
module "storage" {
  source              = "./modules/storage"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
}

# 2. Application Insights Module
module "application_insights" {
  source              = "./modules/application_insights"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
}

# 3. App Service Module (Plan & Frontend)
module "app_service" {
  source              = "./modules/app_service"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  app_name            = var.app_name
}

# 4. Function App Module (API)
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
}
