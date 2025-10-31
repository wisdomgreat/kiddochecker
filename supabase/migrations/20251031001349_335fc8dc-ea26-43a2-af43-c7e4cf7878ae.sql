-- Phase 2 Batch 2A: Complete - Drop unused auth_users_with_emails view
-- This view is no longer used in application code, replaced by get_users_emails() function

DROP VIEW IF EXISTS public.auth_users_with_emails;