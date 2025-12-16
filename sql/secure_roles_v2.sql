-- SECURITY UPDATE: Allow Dashboard Admin (postgres role) to bypass checks

-- 1. Create a secure function that runs BEFORE any profile update
CREATE OR REPLACE FUNCTION public.protect_role_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_email text;
  current_user_role text;
BEGIN
  -- RULE 0: If the user is a Database Admin (service_role or postgres), ALLOW EVERYTHING.
  -- This fixes the issue where you cannot edit rows in the Supabase Dashboard.
  IF (auth.role() = 'service_role' OR current_user = 'postgres') THEN
     RETURN NEW;
  END IF;

  -- Get the email of the user attempting the change via App Logic
  current_user_email := auth.jwt() ->> 'email';
  
  -- Check if the 'role' column is actually changing
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    
    -- RULE 1: The 'taxfriend.tax@gmail.com' account can ALWAYS change roles (The Master Key)
    IF current_user_email = 'taxfriend.tax@gmail.com' THEN
        RETURN NEW;
    END IF;

    -- RULE 2: Existing Superusers can change roles (Promoting others)
    -- We fetch the role of the person making the request
    SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
    
    IF current_user_role = 'superuser' THEN
        RETURN NEW;
    END IF;

    -- IF NEITHER Rule 1 nor Rule 2 is met -> BLOCK THE REQUEST
    RAISE EXCEPTION 'Security Violation: You are not authorized to change user roles.';
  END IF;

  -- If role is not changing, proceed as normal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate the trigger, updating the function is enough.
