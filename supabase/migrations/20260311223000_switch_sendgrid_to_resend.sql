-- Migration: 20260311223000_switch_sendgrid_to_resend.sql

ALTER TABLE public.communication_settings DROP COLUMN IF EXISTS sendgrid_api_key;
ALTER TABLE public.communication_settings DROP COLUMN IF EXISTS sendgrid_from_email;

ALTER TABLE public.communication_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE public.communication_settings ADD COLUMN IF NOT EXISTS resend_domain TEXT;
