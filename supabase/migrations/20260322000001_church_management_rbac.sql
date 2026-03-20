-- Add new permissions for Church Management and CRM
INSERT INTO public.permissions (name, description, category) VALUES
('church_view', 'Access the Church Management Dashboard', 'church'),
('church_manage_members', 'Add, Edit, and Manage church members and profiles', 'church'),
('church_manage_ministries', 'Create and modify ministries and small groups', 'church'),
('church_manage_volunteers', 'Manage volunteer roles and coverage details', 'church'),
('church_crm_view', 'View visitor interactions and CRM timeline', 'crm'),
('church_crm_edit', 'Log interactions, take notes, and send automated follow-up emails', 'crm')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Update RLS for visitor_interactions to use the new has_permission function
-- First, drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Admins can manage interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Users can view assigned interactions" ON public.visitor_interactions;

CREATE POLICY "Users with CRM view permission can see interactions" 
ON public.visitor_interactions 
FOR SELECT 
TO authenticated 
USING (public.has_permission(auth.uid(), 'church_crm_view'));

CREATE POLICY "Users with CRM edit permission can manage interactions" 
ON public.visitor_interactions 
FOR ALL 
TO authenticated 
USING (public.has_permission(auth.uid(), 'church_crm_edit'));
