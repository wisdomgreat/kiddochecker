// Stage 3 of 3: Building the Database Foundation
targetScope = 'resourceGroup'

param location string = 'centralus'
param dbPassword string
param caEnvName string

var sqlContent = loadTextContent('part3.sql')

resource caEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: caEnvName
}

resource stage3Job 'Microsoft.App/jobs@2023-05-01' = {
  name: 'job-foundation-stage3-${substring(uniqueString(resourceGroup().id), 0, 5)}'
  location: location
  properties: {
    environmentId: caEnv.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 600
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
          name: 'migrate'
          image: 'postgres:15'
          env: [
            {
              name: 'PGPASSWORD'
              secretRef: 'db-password'
            }
            {
              name: 'SQL'
              value: sqlContent
            }
          ]
          command: [
            'sh'
            '-c'
            'echo "$SQL" | psql -h 10.0.1.4 -U kiddomin -d postgres && echo "STAGE 3 COMPLETE"'
          ]
        }
      ]
    }
  }
}
