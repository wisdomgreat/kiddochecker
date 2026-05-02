// Bicep for the Full Foundation Migration
targetScope = 'resourceGroup'

param location string = 'centralus'
param dbPassword string
param caEnvName string

var fullSql = loadTextContent('final_schema.sql')

resource caEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: caEnvName
}

resource foundationJob 'Microsoft.App/jobs@2023-05-01' = {
  name: 'job-db-foundation-${substring(uniqueString(resourceGroup().id), 0, 5)}'
  location: location
  properties: {
    environmentId: caEnv.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 1800 // 30 minutes for a big migration
      replicaRetryLimit: 0
      secrets: [
        {
          name: 'db-password'
          value: dbPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'foundation'
          image: 'postgres:15'
          env: [
            {
              name: 'PGPASSWORD'
              secretRef: 'db-password'
            }
            {
              name: 'SQL_CONTENT'
              value: fullSql
            }
          ]
          command: [
            'sh'
            '-c'
            'echo "Connecting to 10.0.1.4..." && echo "$SQL_CONTENT" | psql -h 10.0.1.4 -U kiddomin -d postgres && echo "FOUNDATION DEPLOYED SUCCESSFULLY!"'
          ]
        }
      ]
    }
  }
}
