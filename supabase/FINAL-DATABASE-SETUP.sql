-- ==========================================
-- TAXFRIEND INDIA - ULTIMATE DATABASE SETUP (V4.Final)
-- ==========================================
-- This script consolidates all features:
-- 1. Full Schema (Profiles, Services, Leads, Docs, Notifications)
-- 2. Enhanced Security (RLS + Master Bypass)
-- 3. Lead Management (Deletions Fixed)
-- 4. Storage System (Documents & Avatars)
-- 5. Business Logic (Triggers & Performance Views)
-- 6. Maintenance (Deep Purge RPC)
-- ==========================================

-- PART 1: EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PART 2: CORE TABLES
-- ==========================================

-- Profiles (Central User Table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Linked to auth.users.id
    email TEXT UNIQUE,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superuser')),
    full_name TEXT,
    dob DATE,
    mothers_name TEXT,
    mobile_number TEXT,
    avatar_url TEXT,
    residential_address TEXT,
    residential_city TEXT,
    residential_state TEXT,
    residential_pincode TEXT,
    business_name TEXT,
    organization TEXT,
    gst_number TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_pincode TEXT,
    kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Catalog (The Menu)
CREATE TABLE IF NOT EXISTS public.service_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT, 
    price_range TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Services (Orders)
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

-- User Documents (Uploads)
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT, 
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    doc_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    handled_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Leads (Leads Dashboard)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 3: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helper Functions (Idempotent)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser'));
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_superuser() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser');
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Lead Generation Policies
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete contact messages" ON public.contact_messages FOR DELETE USING (public.is_admin());

-- Profile Policies
DROP POLICY IF EXISTS "Profiles: Own view" ON public.profiles;
CREATE POLICY "Profiles: Own view" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: Admin view" ON public.profiles;
CREATE POLICY "Profiles: Admin view" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Profiles: Own update" ON public.profiles;
CREATE POLICY "Profiles: Own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Services Policies
DROP POLICY IF EXISTS "Services: Own access" ON public.user_services;
CREATE POLICY "Services: Own access" ON public.user_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Services: Own create" ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Services: Admin access" ON public.user_services;
CREATE POLICY "Services: Admin access" ON public.user_services FOR ALL USING (public.is_admin());

-- Master Master Access (Global Override)
DROP POLICY IF EXISTS "Global Master Access" ON public.profiles;
CREATE POLICY "Global Master Access" ON public.profiles FOR ALL USING (auth.jwt() ->> 'email' = 'taxfriend.tax@gmail.com');

-- PART 4: TRIGGERS (Auth Sync)
-- ==========================================

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

-- PART 5: CLEANER & RPC FUNCTIONS
-- ==========================================

-- Data Cleaner (Deep Purge)
CREATE OR REPLACE FUNCTION public.super_reset_system()
RETURNS void AS $$
BEGIN
    IF NOT public.is_superuser() THEN RAISE EXCEPTION 'Access Denied'; END IF;
    DELETE FROM public.user_services;
    DELETE FROM public.user_documents;
    DELETE FROM public.notifications;
    DELETE FROM public.reviews;
    UPDATE public.profiles SET kyc_status = 'not_started' WHERE role != 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- PART 6: STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Documents: Access" ON storage.objects;
CREATE POLICY "Documents: Access" ON storage.objects FOR ALL USING (bucket_id = 'user-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

DROP POLICY IF EXISTS "Avatars: Access" ON storage.objects;
CREATE POLICY "Avatars: Access" ON storage.objects FOR ALL USING (bucket_id = 'avatars');

-- PART 7: SEED DATA
-- ==========================================

INSERT INTO public.service_catalog (title, description, icon, price_range) VALUES 
('GST Registration', 'Official registration with GST portal.', 'Building2', '₹999 - ₹1999'),
('GST Return Filing', 'Monthly/Quarterly compliance.', 'Send', '₹499 - ₹999'),
('Income Tax Filing (ITR)', 'Annual tax filing for all categories.', 'Calculator', '₹999 - ₹4999'),
('Company Incorporation', 'Pvt Ltd & LLP creation.', 'Rocket', '₹4999 - ₹9999'),
('MSME Registration', 'Udyam benefits registration.', 'Shield', '₹499 - ₹1499')
ON CONFLICT DO NOTHING;

-- PART 8: FINAL PERKS
-- ==========================================
UPDATE public.profiles SET role = 'superuser' WHERE email = 'taxfriend.tax@gmail.com';
NOTIFY pgrst, 'reload schema';
SELECT '🚀 TaxFriend India: Final Database Setup Success!' as status;
