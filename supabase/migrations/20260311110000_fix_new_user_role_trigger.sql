-- Fix handle_new_user to avoid auto-assigning parent role to devices
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'target_role')::app_role, 'parent'::app_role);
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    v_role := 'kiosk'::app_role;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  
  RETURN NEW;
END;
$$;