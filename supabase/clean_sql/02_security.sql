-- ==========================================
-- 02_security.sql: RLS & Access Control
-- ==========================================

-- 1. SECURITY HELPER FUNCTIONS (Security Definer to bypass RLS)

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superuser')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles: Users can view own" ON public.profiles;
CREATE POLICY "Profiles: Users can view own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: Admins can view all" ON public.profiles;
CREATE POLICY "Profiles: Admins can view all" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Profiles: Partners manage clients" ON public.profiles;
CREATE POLICY "Profiles: Partners manage clients" ON public.profiles 
FOR ALL 
USING (partner_id = auth.uid())
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'partner' AND 
    partner_id = auth.uid() AND 
    role = 'client'
);

DROP POLICY IF EXISTS "Profiles: Users can update own" ON public.profiles;
CREATE POLICY "Profiles: Users can update own" ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Cannot change role
);


DROP POLICY IF EXISTS "Profiles: Superusers manage all" ON public.profiles;
CREATE POLICY "Profiles: Superusers manage all" ON public.profiles FOR ALL USING (public.is_superuser());

-- 4. SERVICE CATALOG POLICIES
DROP POLICY IF EXISTS "Catalog: Public can view" ON public.service_catalog;
CREATE POLICY "Catalog: Public can view" ON public.service_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS "Catalog: Admins manage" ON public.service_catalog;
CREATE POLICY "Catalog: Admins manage" ON public.service_catalog FOR ALL USING (public.is_admin());

-- 5. USER SERVICES POLICIES
DROP POLICY IF EXISTS "Services: Users view own" ON public.user_services;
CREATE POLICY "Services: Users view own" ON public.user_services FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Services: Users create own" ON public.user_services;
CREATE POLICY "Services: Users create own" ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Services: Users update own" ON public.user_services;
CREATE POLICY "Services: Users update own" ON public.user_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Services: Admins manage all" ON public.user_services;
CREATE POLICY "Services: Admins manage all" ON public.user_services FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Services: Partners view their clients" ON public.user_services;
CREATE POLICY "Services: Partners view their clients" ON public.user_services FOR SELECT USING (
    partner_id = auth.uid() OR
    user_id IN (SELECT id FROM public.profiles WHERE partner_id = auth.uid())
);

DROP POLICY IF EXISTS "Services: Partners create for clients" ON public.user_services;
CREATE POLICY "Services: Partners create for clients" ON public.user_services FOR INSERT WITH CHECK (
    partner_id = auth.uid() AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'partner'
);

-- 6. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notify: Users view own" ON public.notifications;
CREATE POLICY "Notify: Users view own" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Notify: Users update own" ON public.notifications;
CREATE POLICY "Notify: Users update own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notify: Users create for self" ON public.notifications;
CREATE POLICY "Notify: Users create for self" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Notify: Admins create all" ON public.notifications;
CREATE POLICY "Notify: Admins create all" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Notify: Users delete own" ON public.notifications;
CREATE POLICY "Notify: Users delete own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 7. DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Docs: Users move own" ON public.user_documents;
CREATE POLICY "Docs: Users move own" ON public.user_documents FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Docs: Admins manage all" ON public.user_documents;
CREATE POLICY "Docs: Admins manage all" ON public.user_documents FOR ALL USING (public.is_admin());

-- 8. ROYALTIES POLICIES
DROP POLICY IF EXISTS "Royalties: Partners view own" ON public.partner_royalties;
CREATE POLICY "Royalties: Partners view own" ON public.partner_royalties FOR SELECT USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "Royalties: Admins manage" ON public.partner_royalties;
CREATE POLICY "Royalties: Admins manage" ON public.partner_royalties FOR ALL USING (public.is_admin());

-- 9. REVIEWS POLICIES
DROP POLICY IF EXISTS "Reviews: Public view published" ON public.reviews;
CREATE POLICY "Reviews: Public view published" ON public.reviews FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Reviews: Users manage own" ON public.reviews;
CREATE POLICY "Reviews: Users manage own" ON public.reviews FOR ALL USING (user_id = auth.uid());

-- 10. MASTER OVERRIDE FOR ROOT ADMIN
-- This is a safety valve for the master email
DROP POLICY IF EXISTS "Master: Full Access" ON public.profiles;
CREATE POLICY "Master: Full Access" ON public.profiles FOR ALL USING (auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com');

DROP POLICY IF EXISTS "Master: Full Access Services" ON public.user_services;
CREATE POLICY "Master: Full Access Services" ON public.user_services FOR ALL USING (auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com');

DROP POLICY IF EXISTS "Master: Full Access Notifications" ON public.notifications;
CREATE POLICY "Master: Full Access Notifications" ON public.notifications FOR ALL USING (auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com');
-- Enable RLS for payout_requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Admins manage all payout requests
DROP POLICY IF EXISTS "Payouts: Superusers manage all" ON public.payout_requests;
CREATE POLICY "Payouts: Superusers manage all" 
    ON public.payout_requests 
    FOR ALL 
    USING (is_superuser());

-- Partners view their own payout requests
DROP POLICY IF EXISTS "Payouts: Partners view own" ON public.payout_requests;
CREATE POLICY "Payouts: Partners view own" 
    ON public.payout_requests 
    FOR SELECT 
    USING (partner_id = auth.uid());

-- Partners create their own payout requests
DROP POLICY IF EXISTS "Payouts: Partners create own" ON public.payout_requests;
CREATE POLICY "Payouts: Partners create own" 
    ON public.payout_requests 
    FOR INSERT 
    WITH CHECK (partner_id = auth.uid());
