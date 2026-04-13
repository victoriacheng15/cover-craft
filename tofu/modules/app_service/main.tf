variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "app_name" {
  type = string
}

variable "azure_function_key" {
  type      = string
  sensitive = true
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "azurerm_service_plan" "plan" {
  name                = "asp-${var.app_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "F1"
  tags                = var.tags
}

resource "azurerm_linux_web_app" "frontend" {
  name                = "${var.app_name}-ui"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.plan.id
  tags                = var.tags

  site_config {
    always_on = false
    application_stack {
      node_version = "24-lts"
    }
  }

  app_settings = {
    "AZURE_FUNCTION_URL" = "https://${var.app_name}.azurewebsites.net/api"
    "AZURE_FUNCTION_KEY" = var.azure_function_key
    "NODE_ENV"           = "production"
  }
}

output "id" {
  value = azurerm_service_plan.plan.id
}
