-- 📁 File Storage & Quota Management (FSRM-style)
-- Description: Implements configurable upload quotas, hard/soft limits, and file screening.

ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS max_upload_size_kb INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS upload_limit_type TEXT CHECK (upload_limit_type IN ('hard', 'soft')) DEFAULT 'hard',
ADD COLUMN IF NOT EXISTS blocked_extensions TEXT[] DEFAULT ARRAY['exe', 'bat', 'sh', 'php', 'js', 'py'];

-- RLS check for these settings is already covered by previous migrations, 
-- but ensuring they are readable by all authenticated users for client-side enforcement
-- and only editable by admins.
