-- Migration: 20260319000000_fix_redemptions_profiles_join.sql
-- Description: Add foreign key from reward_redemptions(user_id) to profiles(id) to fix PostgREST joins.

-- First, ensure the profiles table exists and its structure
-- Profiles table is assumed to be in the public schema and its ID is a UUID.

-- Add the missing foreign key to reward_redemptions
-- This enables PostgREST to automatically resolve the relationship in select statements.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_redemptions_profiles'
    ) THEN
        ALTER TABLE public.reward_redemptions
        ADD CONSTRAINT fk_redemptions_profiles
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS for reward_redemptions — just making sure to re-grant permissions if needed
GRANT SELECT ON public.reward_redemptions TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
