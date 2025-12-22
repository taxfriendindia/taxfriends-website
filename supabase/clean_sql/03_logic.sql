-- ==========================================
-- 03_logic.sql: Triggers & Functions
-- ==========================================

-- 1. TRIGGER: HANDLE NEW USER SIGNUP
-- Automatically creates a profile when a user signs up via Supabase Auth.
-- Also handles the case where a Partner already created a partial profile.

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  meta_partner_id UUID;
BEGIN
  -- 1. Extract potential partner_id and mobile from metadata
  meta_partner_id := (NEW.raw_user_meta_data->>'partner_id')::UUID;

  -- 2. Check if a profile with this email already exists (pre-created by Partner as a shadow profile)
  SELECT id INTO existing_id FROM public.profiles WHERE email = NEW.email;

  IF existing_id IS NOT NULL THEN
    -- LINKING LOGIC:
    -- Update existing profile to match new Auth ID.
    -- Foreign keys with ON UPDATE CASCADE will handle all dependent records (services, etc.)
    UPDATE public.profiles 
    SET id = NEW.id,
        partner_id = COALESCE(partner_id, meta_partner_id), -- Favor existing partner but fallback to meta
        updated_at = NOW()
    WHERE id = existing_id;
  ELSE
    -- STANDARD LOGIC: Create new profile
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      avatar_url, 
      role, 
      partner_id, 
      mobile_number
    )
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'avatar_url',
      CASE 
        WHEN NEW.email = 'taxfriend.tax@gmail.com' THEN 'superuser'
        ELSE 'client'
      END,
      meta_partner_id,
      NEW.raw_user_meta_data->>'mobile_number'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. ADMIN VIEW: CLIENT SUMMARY
DROP VIEW IF EXISTS public.admin_client_view;
CREATE OR REPLACE VIEW public.admin_client_view AS
SELECT 
  p.*,
  COUNT(us.id) as total_requests,
  SUM(CASE WHEN us.status IN ('pending', 'processing') THEN 1 ELSE 0 END) as pending_requests
FROM public.profiles p
LEFT JOIN public.user_services us ON p.id = us.user_id
GROUP BY p.id;

-- 3. HELPER: UPDATE USER ROLE (Superuser only)
DROP FUNCTION IF EXISTS public.update_user_role(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  IF public.is_superuser() THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only superuser can change roles';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: HANDLE PAYOUT COMPLETION
-- Automatically subtracts amount from partner's wallet when status is 'completed'.
DROP TRIGGER IF EXISTS on_payout_completed ON public.payout_requests;
DROP FUNCTION IF EXISTS public.handle_payout_completion();

CREATE OR REPLACE FUNCTION public.handle_payout_completion() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance - NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payout_completed
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_payout_completion();

-- 5. SECURE: KYC VERIFICATION (Admin/Superuser only)
-- Explicitly checks admin status in backend for security
DROP FUNCTION IF EXISTS public.verify_partner_kyc(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.verify_partner_kyc(target_partner_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser')) THEN
    UPDATE public.profiles 
    SET kyc_status = new_status,
        updated_at = NOW()
    WHERE id = target_partner_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only administrators can verify KYC';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
