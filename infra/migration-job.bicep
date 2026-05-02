param location string
param subnetId string
param dbHost string
param dbUser string
@secure()
param dbPassword string
param sqlContent string

resource migrationContainer 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: 'aci-migration-${uniqueString(resourceGroup().id)}'
  location: location
  properties: {
    containers: [
      {
        name: 'migration-worker'
        properties: {
          image: 'postgres:15-alpine'
          command: [
            'sh'
            '-c'
            'echo "$SQL_CONTENT" > migration.sql && PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d kiddochecker -f migration.sql'
          ]
          environmentVariables: [
            {
              name: 'SQL_CONTENT'
              value: sqlContent
            }
            {
              name: 'DB_PASSWORD'
              value: dbPassword
            }
            {
              name: 'DB_HOST'
              value: dbHost
            }
            {
              name: 'DB_USER'
              value: dbUser
            }
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Never'
    subnetIds: [
      {
        id: subnetId
      }
    ]
  }
}
