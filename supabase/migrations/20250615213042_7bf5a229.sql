
-- Step 1: Create a function to assign organization creator role
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's role to super_admin and set is_super_admin flag
  UPDATE public.user_roles 
  SET 
    role = 'super_admin'::app_role,
    is_super_admin = true,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Update organization settings to link creator
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Step 2: Update the handle_new_user function to check for organization setup context
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is an organization creator signup
  -- If so, skip default role assignment (will be handled by assign_organization_creator_role)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    -- Assign default parent role for regular signups only
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
