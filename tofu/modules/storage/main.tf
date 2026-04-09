variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "app_name" {
  type = string
}

resource "azurerm_storage_account" "storage" {
  name                     = "st${replace(var.app_name, "-", "")}can"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

output "id" {
  value = azurerm_storage_account.storage.id
}

output "name" {
  value = azurerm_storage_account.storage.name
}

output "primary_access_key" {
  value     = azurerm_storage_account.storage.primary_access_key
  sensitive = true
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.storage.primary_blob_endpoint
}
