-- 📧 Add Email column and standardize Zip Code in profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Standardize zip to zip_code if needed
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip') THEN
    ALTER TABLE public.profiles RENAME COLUMN zip TO zip_code;
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
  END IF;
END $$;

-- Update existing trigger to sync email and zip_code
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
  );
  
  -- Logic for role assignment 
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;
