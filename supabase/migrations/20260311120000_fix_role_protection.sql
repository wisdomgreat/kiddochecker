-- Fix protect_user_role to allow Admins to manage roles
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role app_role;
BEGIN
  IF auth.uid() IS NULL THEN
     RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role FROM public.user_roles WHERE user_id = auth.uid();

  IF v_actor_role = 'super_admin' THEN
     RETURN NEW;
  END IF;

  IF v_actor_role = 'admin' THEN
     IF (NEW.role = 'super_admin' OR NEW.role = 'admin') AND (OLD.role != 'super_admin' AND OLD.role != 'admin') THEN
         RAISE EXCEPTION 'Admins cannot escalate users to Admin levels.';
     END IF;
     RETURN NEW;
  END IF;

  IF NEW.role != OLD.role OR NEW.is_super_admin != OLD.is_super_admin THEN
      NEW.role := OLD.role;
      NEW.is_super_admin := OLD.is_super_admin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;