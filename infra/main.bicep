// Master Bicep file for KiddoChecker Azure Micro-Architecture

targetScope = 'resourceGroup'

@description('The location for all resources.')
param location string = 'eastus2'

@description('The name of the application.')
param appName string = 'kiddocheck'

var uniqueSuffix = uniqueString(resourceGroup().id)
var acrName = 'acr${uniqueSuffix}'
var keyVaultName = 'kv${appName}${substring(uniqueSuffix, 0, 5)}'
var dbServerName = 'db-${appName}-${uniqueSuffix}'
var caEnvName = 'cae-${appName}-${uniqueSuffix}'
var swaName = 'swa-${appName}-${uniqueSuffix}'

// 1. Azure Container Registry (ACR) - To store our microservice images
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// 2. Azure Key Vault - For managing secrets (DB passwords, API keys)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
  }
}

// 3. PostgreSQL Flexible Server - Our Multi-tenant database
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: dbServerName
  location: location
  sku: {
    name: 'Standard_B1ms' // Burstable for cost efficiency
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'kiddomin'
    administratorLoginPassword: '${uniqueSuffix}A1!' // You should change this later
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

// Allow Azure services to access the database (for development simplicity)
resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// 4. Container Apps Environment - The "cluster" for our microservices
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: caEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 5. Log Analytics - For monitoring and speed analysis
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${appName}-${uniqueSuffix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// 6. Azure Static Web App - For the React Frontend
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swaName
  location: 'eastus2' // SWAs are only available in specific regions
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

output acrLoginServer string = acr.properties.loginServer
output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output keyVaultUri string = keyVault.properties.vaultUri
