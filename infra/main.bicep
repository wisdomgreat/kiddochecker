// Master Bicep file for KiddoChecker Azure Micro-Architecture
// Region Strategy: Unified in Central US for high capacity and full service support.

targetScope = 'resourceGroup'

@description('The primary region for all resources.')
param location string = 'centralus'

@description('The short name of the application.')
param appName string = 'kcheck'

@description('The deployment environment.')
param env string = 'prod'

@description('Database administrator password.')
@secure()
param administratorLoginPassword string

// Unique string based on resource group to prevent naming collisions
var suffix = substring(uniqueString(resourceGroup().id), 0, 5)

// Resource Names
var acrName = 'cr${appName}${suffix}' 
var keyVaultName = 'kv${appName}${suffix}'
var dbServerName = 'psql-${appName}-${suffix}'
var caEnvName = 'cae-${appName}-${suffix}'
var swaName = 'swa-${appName}-${suffix}'
var logWorkspaceName = 'log-${appName}-${suffix}'

// Standard Tags
var tags = {
  Project: 'KiddoChecker'
  Environment: env
  ManagedBy: 'Antigravity-AI'
}

@description('1. Azure Container Registry - Stores microservice Docker images.')
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

@description('2. Azure Key Vault - Securely manages secrets and API keys.')
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}

@description('3. PostgreSQL Flexible Server - Primary multi-tenant database.')
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: dbServerName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms' 
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'kiddomin'
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
    }
  }
}

@description('Database Firewall Rule - Allows Azure services to connect.')
resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('4. Container Apps Environment - The hosting environment for all microservices.')
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: caEnvName
  location: location
  tags: tags
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

@description('5. Log Analytics Workspace - Centralized monitoring and performance metrics.')
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

@description('6. Azure Static Web App - Hosts the React frontend with global CDN distribution.')
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swaName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

output acrLoginServer string = acr.properties.loginServer
output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output keyVaultUri string = keyVault.properties.vaultUri
output dbServerName string = postgresServer.name
