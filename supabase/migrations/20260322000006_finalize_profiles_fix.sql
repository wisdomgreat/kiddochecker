-- 📧 Final Profile Expansion and Trigger Fix
DO $$ 
BEGIN 
  -- Ensure email exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Ensure zip_code exists (fallback from zip)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip') THEN
    ALTER TABLE public.profiles RENAME COLUMN zip TO zip_code;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip_code') THEN
    ALTER TABLE public.profiles ADD COLUMN zip_code TEXT;
  END IF;
END $$;

-- Fix/Upgrade handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email,
    phone, 
    gender, 
    date_of_birth,
    address,
    city,
    state,
    zip_code
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'zip' -- Map 'zip' from metadata to 'zip_code' column
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code;
  
  -- Logic for role assignment 
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
