-- Seed placeholder church domains for testing before real DNS is ready.
-- Actual Azure Front Door endpoint: kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net
-- All traffic hits that single hostname; the X-Forwarded-Host header distinguishes tenants.
-- For now the bare endpoint is the English church (default).
-- When real domains arrive, replace these rows with the production domains.

CREATE TABLE IF NOT EXISTS public.churches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        TEXT UNIQUE NOT NULL,
  language      TEXT,
  branding_json JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.churches (id, domain, language, branding_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net',    'en', '{"name":"English Church","logo":""}'),
  ('00000000-0000-0000-0000-000000000002', 'es.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net', 'es', '{"name":"Spanish Church","logo":""}'),
  ('00000000-0000-0000-0000-000000000000', 'joint.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net', NULL, '{"name":"Joint Service","logo":""}')
ON CONFLICT (id) DO UPDATE SET
  domain        = EXCLUDED.domain,
  language      = EXCLUDED.language,
  branding_json = EXCLUDED.branding_json;
