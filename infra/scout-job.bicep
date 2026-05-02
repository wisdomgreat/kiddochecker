// "Smart Scout" Migration Job with advanced logging
targetScope = 'resourceGroup'

param location string = 'centralus'
param dbPassword string
param caEnvName string

resource caEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: caEnvName
}

resource migrationJob 'Microsoft.App/jobs@2023-05-01' = {
  name: 'job-db-scout-${substring(uniqueString(resourceGroup().id), 0, 5)}'
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
          name: 'scout'
          image: 'node:18-slim'
          env: [
            {
              name: 'DB_PASSWORD'
              secretRef: 'db-password'
            }
          ]
          command: [
            'node'
            '-e'
            'const net = require("net"); const { Client } = require("pg"); const host = "10.0.1.4"; async function run() { console.log("--- STARTING NETWORK SCOUT ---"); console.log("1. Testing TCP Connection to 10.0.1.4:5432..."); const socket = net.createConnection(5432, host, () => { console.log("SUCCESS: Port 5432 is open!"); socket.end(); }).on("error", (e) => { console.error("FAILURE: Port 5432 is unreachable!", e); process.exit(1); }); await new Promise(r => setTimeout(r, 2000)); console.log("2. Attempting Postgres Authentication..."); const client = new Client({ host, user: "kiddomin", password: process.env.DB_PASSWORD, database: "postgres", ssl: true }); try { await client.connect(); console.log("SUCCESS: Authenticated successfully!"); await client.query("CREATE TABLE IF NOT EXISTS public.organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, language_code TEXT DEFAULT \'en\', timezone TEXT DEFAULT \'UTC\', is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()); ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.children ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id); INSERT INTO public.organizations (name, slug, language_code) VALUES (\'KiddoChecker English\', \'english-church\', \'en\'), (\'KiddoChecker Spanish\', \'spanish-church\', \'es\') ON CONFLICT (slug) DO NOTHING;"); console.log("SUCCESS: Database schema updated!"); } catch (err) { console.error("FAILURE: Auth or Query failed!", err); process.exit(1); } finally { await client.end(); } } run();'
          ]
        }
      ]
    }
  }
}
