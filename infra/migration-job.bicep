param location string
param subnetId string
param dbHost string
param dbUser string
@secure()
param dbPassword string
param migrationImage string

var acrName = split(migrationImage, '.')[0]

resource migrationContainer 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: 'aci-migration-${uniqueString(resourceGroup().id)}'
  location: location
  properties: {
    imageRegistryCredentials: [
      {
        server: split(migrationImage, '/')[0]
        username: acrName
        password: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', acrName), '2023-07-01').passwords[0].value
      }
    ]
    containers: [
      {
        name: 'migration-worker'
        properties: {
          image: migrationImage
          environmentVariables: [
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
