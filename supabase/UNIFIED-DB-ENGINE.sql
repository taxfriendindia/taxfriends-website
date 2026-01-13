-- ==========================================
-- TAXFRIEND INDIA - ABSOLUTE FINAL DATABASE SETUP (V5.PRODUCTION)
-- ==========================================
-- This script consolidates EVERY feature:
-- 1. Full Schema (Profiles, Services, Documents, Archives, Notifications, Leads)
-- 2. Enhanced Security (Anti-Role Hijacking, RLS, Master Bypass)
-- 3. Business Logic (Purge Triggers, Auth Sync, Helper Functions)
-- 4. Storage System (Documents, Avatars, Archives)
-- 5. Data Consistency (Legacy Column Cleanup & New Column Support)
-- ==========================================

-- PART 1: EXTENSIONS & INITIAL SETUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PART 2: CORE TABLES (IDEMPOTENT)
-- ==========================================

-- 1. Profiles (Central User Table)
-- CLEANUP: Identify and merge duplicates before enforcing uniqueness
-- We keep the one with most data or the latest one
DO $$ 
BEGIN
    -- Reassign dependent data from duplicates to the latest profile
    -- This fixes the FK constraint error (23503) seen in logs
    UPDATE public.user_services us
    SET user_id = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE us.user_id = old.id AND old.id <> latest.id;

    UPDATE public.user_services us_h
    SET handled_by = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE us_h.handled_by = old.id AND old.id <> latest.id;

    UPDATE public.user_documents ud
    SET user_id = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE ud.user_id = old.id AND old.id <> latest.id;

    UPDATE public.user_documents ud_h
    SET handled_by = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE ud_h.handled_by = old.id AND old.id <> latest.id;

    UPDATE public.user_documents ud_u
    SET uploaded_by = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE ud_u.uploaded_by = old.id AND old.id <> latest.id;

    UPDATE public.service_archives sa
    SET user_id = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE sa.user_id = old.id AND old.id <> latest.id;

    UPDATE public.service_archives sa_u
    SET uploaded_by = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE sa_u.uploaded_by = old.id AND old.id <> latest.id;

    UPDATE public.profiles p_ref
    SET referred_by = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE p_ref.referred_by = old.id AND old.id <> latest.id;

    UPDATE public.notifications n
    SET user_id = latest.id
    FROM (SELECT DISTINCT ON (email) id, email FROM public.profiles ORDER BY email, created_at DESC) latest
    JOIN public.profiles old ON old.email = latest.email
    WHERE n.user_id = old.id AND old.id <> latest.id;

    -- Now safe to delete ghost profiles (older versions)
    DELETE FROM public.profiles p1
    USING public.profiles p2
    WHERE p1.email = p2.email 
      AND p1.id <> p2.id 
      AND p1.created_at < p2.created_at;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Linked to auth.users.id
    email TEXT UNIQUE,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superuser', 'partner')), -- Added partner role
    full_name TEXT,
    dob DATE,
    mothers_name TEXT,
    mobile_number TEXT,
    avatar_url TEXT,
    -- Address Fields
    residential_address TEXT,
    residential_city TEXT,
    residential_state TEXT,
    residential_pincode TEXT,
    -- Business Fields
    business_name TEXT,
    organization TEXT,
    gst_number TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_pincode TEXT,
    -- Partner & KYB Fields (Newly Added)
    aadhar_number TEXT,
    pan_number TEXT,
    partner_id TEXT,
    referred_by UUID REFERENCES public.profiles(id),
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    payout_upi TEXT,
    -- Maintenance Columns
    kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Service Catalog
CREATE TABLE IF NOT EXISTS public.service_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Services (Orders)
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'quality_check', 'completed', 'rejected', 'cancelled')),
    comments TEXT,
    handled_by UUID REFERENCES public.profiles(id),
    completed_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Documents (KYC/Uploads)
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT, 
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    doc_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id), -- For Partners/Admins
    handled_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Service Archives (Folder System)
CREATE TABLE IF NOT EXISTS public.service_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    domain TEXT NOT NULL, 
    service_names TEXT[] NOT NULL, 
    sub_type TEXT, 
    year_type TEXT CHECK (year_type IN ('AY', 'FY')),
    year TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Contact Leads
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 3: HELPER FUNCTIONS & LOGIC
-- ==========================================

-- Admin Checks
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser'));
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_superuser() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser');
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Role Protection (Security Barrier)
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role <> NEW.role) THEN
        IF NOT (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
            OR auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com'
        ) THEN
            RAISE EXCEPTION 'Access Denied: You do not have permission to modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_user_roles ON public.profiles;
CREATE TRIGGER tr_protect_user_roles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_user_roles();

-- Notification Purge (7-Day Rule)
CREATE OR REPLACE FUNCTION public.purge_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_purge_old_notifications ON public.notifications;
CREATE TRIGGER tr_purge_old_notifications AFTER INSERT ON public.notifications FOR EACH STATEMENT EXECUTE FUNCTION public.purge_old_notifications();

-- Auth User Creation Sync
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN NEW.email = 'taxfriend.tax@gmail.com' THEN 'superuser' ELSE 'client' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PART 4: SECURITY (RLS POLICIES)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Master Bypass (Secure Context)
DROP POLICY IF EXISTS "Global Master Access" ON public.profiles;
CREATE POLICY "Global Master Access" ON public.profiles FOR ALL USING (
    auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com' 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superuser'
);

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Profiles: Own view" ON public.profiles;
CREATE POLICY "Profiles: Own view" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Profiles: Own update" ON public.profiles;
CREATE POLICY "Profiles: Own update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 3. Service Catalog (Public Viewable)
DROP POLICY IF EXISTS "Catalog: Public View" ON public.service_catalog;
CREATE POLICY "Catalog: Public View" ON public.service_catalog FOR SELECT USING (true);

-- 4. User Services (Orders)
DROP POLICY IF EXISTS "Services: Own View" ON public.user_services;
CREATE POLICY "Services: Own View" ON public.user_services FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Services: Admin All" ON public.user_services;
CREATE POLICY "Services: Admin All" ON public.user_services FOR ALL USING (public.is_admin());

-- 5. Documents & Archives (Encrypted/Private Context)
DROP POLICY IF EXISTS "Docs: View Access" ON public.user_documents;
CREATE POLICY "Docs: View Access" ON public.user_documents FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Docs: Own Insert" ON public.user_documents;
CREATE POLICY "Docs: Own Insert" ON public.user_documents FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Docs: Admin Delete" ON public.user_documents;
CREATE POLICY "Docs: Admin Delete" ON public.user_documents FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Archives: View Access" ON public.service_archives;
CREATE POLICY "Archives: View Access" ON public.service_archives FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Archives: Admin All" ON public.service_archives;
CREATE POLICY "Archives: Admin All" ON public.service_archives FOR ALL USING (public.is_admin());

-- 6. Notifications
DROP POLICY IF EXISTS "Notify: Own View" ON public.notifications;
CREATE POLICY "Notify: Own View" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Notify: Own Update" ON public.notifications;
CREATE POLICY "Notify: Own Update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 7. Contact Leads
DROP POLICY IF EXISTS "Anyone can insert" ON public.contact_messages;
CREATE POLICY "Anyone can insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view" ON public.contact_messages;
CREATE POLICY "Admins can view" ON public.contact_messages FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete" ON public.contact_messages;
CREATE POLICY "Admins can delete" ON public.contact_messages FOR DELETE USING (public.is_admin());

-- PART 5: STORAGE BUCKETS & HARDENED PERMISSIONS
-- ==========================================
-- NOTE: user-documents and service-archives are PRIVATE (public: false) to prevent URL leakage
INSERT INTO storage.buckets (id, name, public) VALUES 
('user-documents', 'user-documents', false),
('avatars', 'avatars', true),
('service-archives', 'service-archives', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage Policies: Documents & Archives (Privacy First)
DROP POLICY IF EXISTS "Docs Storage Access" ON storage.objects;
CREATE POLICY "Docs Storage: Owner View/Upload" ON storage.objects 
FOR ALL USING (
    bucket_id IN ('user-documents', 'service-archives') 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

-- Storage Policies: Avatars (Secure Public Access)
DROP POLICY IF EXISTS "Avatar Storage Access" ON storage.objects;
CREATE POLICY "Avatar: Public Read" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar: Restricted Manage" ON storage.objects 
FOR ALL USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- PART 6: SEED DATA & RPCs
-- ==========================================

-- Secure Role Update RPC
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role TEXT)
RETURNS void AS $$
BEGIN
    IF NOT (public.is_superuser() OR auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com') THEN
        RAISE EXCEPTION 'Access Denied: Superuser privileges required.';
    END IF;
    UPDATE public.profiles SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Database Repair RPC: Deduplicate Users
CREATE OR REPLACE FUNCTION public.repair_duplicate_profiles()
RETURNS json AS $$
DECLARE
    deleted_count int;
BEGIN
    IF NOT (public.is_superuser() OR auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com') THEN
        RAISE EXCEPTION 'Access Denied: Superuser privileges required.';
    END IF;

    -- Keep the latest version of each profile by email
    WITH duplicates AS (
        SELECT id, email, 
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rank
        FROM public.profiles
        WHERE email IS NOT NULL
    )
    DELETE FROM public.profiles
    WHERE id IN (SELECT id FROM duplicates WHERE rank > 1);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object('status', 'success', 'deleted_count', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Catalog Seed
INSERT INTO public.service_catalog (title, description, icon) VALUES 
('GST Registration', 'Official registration with GST portal.', 'Building2'),
('GST Return Filing', 'Monthly/Quarterly compliance.', 'Send'),
('Income Tax Filing (ITR)', 'Annual tax filing for all categories.', 'Calculator'),
('PF Withdrawal', 'Professional assistance for PF fund withdrawal.', 'Wallet'),
('MSME Registration', 'Udyam benefits registration.', 'Shield')
ON CONFLICT DO NOTHING;

-- FINAL STEP: Superuser Escalation
UPDATE public.profiles SET role = 'superuser' WHERE email = 'taxfriend.tax@gmail.com';

SELECT '🚀 TaxFriend India: Unified Database Engine Online!' as status;
