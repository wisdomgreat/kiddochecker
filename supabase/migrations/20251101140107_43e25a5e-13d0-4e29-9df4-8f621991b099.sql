-- Phase 3 Batch 3B: Fix Security Answer Storage
-- Issue: Security answers stored in plaintext, should be hashed

-- Add new column for hashed security answer
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS security_answer_hash TEXT;

-- Create function to hash security answers
CREATE OR REPLACE FUNCTION public.hash_security_answer(answer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use crypt extension for secure hashing
  RETURN crypt(LOWER(TRIM(answer)), gen_salt('bf', 8));
END;
$$;

-- Create function to verify security answer
CREATE OR REPLACE FUNCTION public.verify_security_answer(user_id UUID, answer TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT security_answer_hash INTO stored_hash
  FROM profiles
  WHERE id = user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare provided answer hash with stored hash
  RETURN stored_hash = crypt(LOWER(TRIM(answer)), stored_hash);
END;
$$;

-- Note: The security_answer column will be deprecated
-- New implementations should use security_answer_hash + hash_security_answer()
-- Old data can be migrated manually if needed