/* 
  MASTER SCRIPT 3: SERVICES & DOCUMENTS (ADMIN FEATURES)
  Run this script THIRD. 
*/

-- 1. Create SERVICE CATALOG Table
CREATE TABLE IF NOT EXISTS public.service_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL
);

-- Safely add columns if they are missing
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS category TEXT;

-- RELAX CONSTRAINTS (Fix for "violates not-null constraint" error)
-- We ensure these columns allow NULL values just in case they were created strictly before.
ALTER TABLE public.service_catalog ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.service_catalog ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.service_catalog ALTER COLUMN category DROP NOT NULL;

-- 2. Create USER DOCUMENTS Table
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL
);

-- Safely add columns if missing
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Create USER SERVICES Table
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL
);

-- Safely add columns if missing
ALTER TABLE public.user_services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.user_services ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.user_services ADD COLUMN IF NOT EXISTS service_catalog_id UUID REFERENCES public.service_catalog(id);

-- 4. ENABLE RLS
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Service Catalog
DROP POLICY IF EXISTS "Public can view catalog" ON public.service_catalog;
DROP POLICY IF EXISTS "Admin can manage catalog" ON public.service_catalog;

CREATE POLICY "Public can view catalog" ON public.service_catalog FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalog" ON public.service_catalog FOR ALL USING (auth.email() = 'taxfriend.tax@gmail.com');

-- User Documents
DROP POLICY IF EXISTS "Users view own docs" ON public.user_documents;
DROP POLICY IF EXISTS "Users upload own docs" ON public.user_documents;
DROP POLICY IF EXISTS "Admin full access docs" ON public.user_documents;

CREATE POLICY "Users view own docs" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upload own docs" ON public.user_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access docs" ON public.user_documents FOR ALL USING (auth.email() = 'taxfriend.tax@gmail.com');

-- User Services
DROP POLICY IF EXISTS "Users view own services" ON public.user_services;
DROP POLICY IF EXISTS "Users request services" ON public.user_services;
DROP POLICY IF EXISTS "Admin full access services" ON public.user_services;

CREATE POLICY "Users view own services" ON public.user_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users request services" ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access services" ON public.user_services FOR ALL USING (auth.email() = 'taxfriend.tax@gmail.com');

-- 6. SEED DATA
-- We now include descriptions to be extra safe.
INSERT INTO public.service_catalog (title, category, price, description)
VALUES 
('GST Registration', 'Registration', 1499, 'Complete GST registration service'),
('Income Tax Filing', 'Tax', 999, 'Individual ITR filing service'),
('FSSAI License', 'License', 2499, 'Food license registration'),
('Company Incorporation', 'Registration', 7999, 'Private Limited or LLP registration'),
('Trademark Registration', 'Intellectual Property', 4999, 'Protect your brand identity')
ON CONFLICT DO NOTHING;
