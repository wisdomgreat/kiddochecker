// Master Bicep file for KiddoChecker Azure Micro-Architecture
// Naming Convention: [ServiceCode]-[AppName]-[Environment]-[Region]-[Suffix]

targetScope = 'resourceGroup'

@description('The Azure region for all resources.')
param location string = 'eastus2'

@description('The short name of the application.')
param appName string = 'kiddocheck'

@description('The deployment environment (e.g., prod, staging, dev).')
param env string = 'prod'

@description('Database administrator password.')
@secure()
param administratorLoginPassword string

// Unique string based on resource group to prevent naming collisions
var suffix = substring(uniqueString(resourceGroup().id), 0, 5)
var regionCode = 'eus2'

// Resource Names
var acrName = 'cr${appName}${env}${regionCode}${suffix}' // ACR cannot have hyphens
var keyVaultName = 'kv-${appName}-${env}-${regionCode}-${suffix}'
var dbServerName = 'psql-${appName}-${env}-${regionCode}-${suffix}'
var caEnvName = 'cae-${appName}-${env}-${regionCode}-${suffix}'
var swaName = 'stapp-${appName}-${env}-${regionCode}-${suffix}'
var logWorkspaceName = 'log-${appName}-${env}-${regionCode}-${suffix}'

// Standard Tags for all resources
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
  location: 'eastus2' 
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

output acrLoginServer string = acr.properties.loginServer
output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output keyVaultUri string = keyVault.properties.vaultUri
output dbServerName string = postgresServer.name
