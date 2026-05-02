// Master Bicep file for KiddoChecker Azure Micro-Architecture
// Clean Slate Strategy: Unified in Central US with Professional Branding

targetScope = 'resourceGroup'

@description('The primary region for all resources.')
param location string = 'centralus'

@description('The short name of the application.')
param appName string = 'kiddo'

@description('The deployment environment.')
param env string = 'prod'

@description('Database administrator password.')
@secure()
param administratorLoginPassword string

// Unique string based on resource group to prevent naming collisions
var suffix = substring(uniqueString(resourceGroup().id), 0, 5)

// Resource Names
var vnetName = 'vnet-${appName}-${env}-${suffix}'
var acrName = 'cr${appName}${env}${suffix}' 
var keyVaultName = 'kv${appName}${env}${suffix}'
var dbServerName = 'psql-${appName}-${env}-${suffix}'
var caEnvName = 'cae-${appName}-${env}-${suffix}'
var swaName = 'swa-${appName}-${env}-${suffix}'
var logWorkspaceName = 'log-${appName}-${env}-${suffix}'
var privateDnsZoneName = '${dbServerName}.private.postgres.database.azure.com'

// Standard Tags
var tags = {
  Project: 'KiddoChecker'
  Environment: env
  ManagedBy: 'TDWAS Technology'
}

@description('0. Virtual Network - The private security perimeter.')
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'snet-postgres'
        properties: {
          addressPrefix: '10.0.1.0/24'
          delegations: [
            {
              name: 'dlg-postgres'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: 'snet-app'
        properties: {
          addressPrefix: '10.0.2.0/24'
          delegations: [
            {
              name: 'dlg-app'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
    ]
  }
}

@description('Private DNS Zone for PostgreSQL isolation.')
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZoneName
  location: 'global'
  tags: tags
}

@description('Link Private DNS Zone to the VNet.')
resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${vnetName}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

@description('1. Azure Container Registry')
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

@description('2. Azure Key Vault')
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

@description('3. PostgreSQL Flexible Server - Now Isolated in VNet.')
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: dbServerName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms' 
    tier: 'Burstable'
  }
  dependsOn: [
    vnetLink
  ]
  properties: {
    version: '15'
    administratorLogin: 'kiddomin'
    administratorLoginPassword: administratorLoginPassword
    network: {
      delegatedSubnetResourceId: vnet.properties.subnets[0].id
      privateDnsZoneArmResourceId: privateDnsZone.id
    }
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
    }
  }
}

@description('4. Container Apps Environment - Integrated with Networking.')
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
    vnetConfiguration: {
      infrastructureSubnetId: vnet.properties.subnets[1].id
      internal: false
    }
  }
}

@description('5. Log Analytics Workspace')
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

@description('6. Azure Static Web App')
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

@description('7. Data Bridge API - Container App')
resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-api-${appName}-${env}-${suffix}'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'db-password'
          value: administratorLoginPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'bridge-api'
          image: '${acr.properties.loginServer}/bridge-api:latest'
          env: [
            {
              name: 'DB_HOST'
              value: '${dbServerName}.private.postgres.database.azure.com'
            }
            {
              name: 'DB_PASSWORD'
              secretRef: 'db-password'
            }
            {
              name: 'DB_USER'
              value: 'kiddomin'
            }
            {
              name: 'DB_NAME'
              value: 'kiddochecker'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output keyVaultUri string = keyVault.properties.vaultUri
output dbServerName string = postgresServer.name
output vnetName string = vnet.name
