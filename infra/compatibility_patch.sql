CREATE SCHEMA IF NOT EXISTS auth; 
CREATE EXTENSION IF NOT EXISTS pgcrypto; 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Compatibility Patch for Azure Migration
-- Ensures the profiles table can store Azure Object IDs for identity linking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS azure_oid TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_azure_oid ON public.profiles(azure_oid);
