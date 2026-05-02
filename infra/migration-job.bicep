// Bicep for a "One-Time" Migration Job inside the VNet
targetScope = 'resourceGroup'

param location string = 'centralus'
param dbServerName string
param dbPassword string
param vnetName string
param caEnvName string

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: vnetName
}

resource caEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: caEnvName
}

resource migrationJob 'Microsoft.App/jobs@2023-05-01' = {
  name: 'job-db-migrate-${substring(uniqueString(resourceGroup().id), 0, 5)}'
  location: location
  properties: {
    environmentId: caEnv.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 300
      replicaRetryLimit: 1
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
          image: 'postgres:15' // Using a standard tag to ensure pull success
          env: [
            {
              name: 'PGPASSWORD'
              secretRef: 'db-password'
            }
          ]
          command: [
            'sh'
            '-c'
            'echo "Testing connection to 10.0.1.4..." && psql -h 10.0.1.4 -U kiddomin -d postgres -c "SELECT version();" && echo "Connection Successful! Running Migration..." && psql -h 10.0.1.4 -U kiddomin -d postgres -c "CREATE TABLE IF NOT EXISTS public.organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, language_code TEXT DEFAULT \'en\', timezone TEXT DEFAULT \'UTC\', is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()); ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.children ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); INSERT INTO public.organizations (name, slug, language_code) VALUES (\'KiddoChecker English\', \'english-church\', \'en\'), (\'KiddoChecker Spanish\', \'spanish-church\', \'es\') ON CONFLICT (slug) DO NOTHING;"'
          ]
        }
      ]
    }
  }
}
