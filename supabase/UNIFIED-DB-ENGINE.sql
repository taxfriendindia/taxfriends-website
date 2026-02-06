-- ==========================================
-- TAXFRIEND INDIA - FINAL V5 + SEPARATED ARCHITECTURE
-- ==========================================
-- MERGED: Robust V5 Logic + Strict Document Separation (Records vs Docs)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PART 1: MIGRATION & CLEANUP (Pre-Flight)
-- ==========================================
-- We try to migrate data if 'user_files' exists before we drop/replace it.
DO $$ 
BEGIN
    -- Create temp tables to hold data if original tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_files') THEN
        CREATE TABLE IF NOT EXISTS public.temp_migration_files AS SELECT * FROM public.user_files;
    END IF;
END $$;

-- ==========================================
-- PART 2: CORE TABLES
-- ==========================================

-- 1. Profiles (Unchanged logic)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superuser', 'partner')),
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
    aadhar_number TEXT,
    pan_number TEXT,
    partner_id TEXT,
    referred_by UUID REFERENCES public.profiles(id),
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    payout_upi TEXT,
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

-- 3. User Services
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    comments TEXT,
    handled_by UUID REFERENCES public.profiles(id),
    completed_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Client Supporting Docs (Input Stream) - REPLACES old user_documents
-- This is where Clients upload their files.
CREATE TABLE IF NOT EXISTS public.client_supporting_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT, 
    file_size BIGINT,
    file_type TEXT,
    description TEXT, -- Service Context (e.g. "For GST Registration")
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    admin_feedback TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Service Archives (LEGACY - Kept for compatibility, but moving towards service_records)
CREATE TABLE IF NOT EXISTS public.service_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    domain TEXT NOT NULL, 
    service_names TEXT[] NOT NULL, 
    sub_type TEXT, 
    year_type TEXT,
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

-- ==========================================
-- PART 3: FOLDER SYSTEM (THE VAULT)
-- ==========================================

-- 1. User Folders
CREATE TABLE IF NOT EXISTS public.user_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.user_folders(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#4F46E5',
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_folder_name_per_parent UNIQUE(user_id, parent_folder_id, name)
);

-- 2. Service Records (Output Stream) - REPLACES old user_files
-- This is where Admins upload deliverables into folders.
CREATE TABLE IF NOT EXISTS public.service_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES public.user_folders(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    tags TEXT[],
    description TEXT,
    -- Legacy metadata columns preserved
    domain TEXT,
    service_names TEXT[],
    sub_type TEXT,
    year_type TEXT,
    year TEXT,
    status TEXT DEFAULT 'completed',
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PART 4: SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_supporting_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles: Public Match" ON public.profiles FOR SELECT USING (true); -- Simplified
CREATE POLICY "Profiles: Own Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Client Docs Policies (Input Stream)
CREATE POLICY "Docs: Client Manage" ON public.client_supporting_docs 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Docs: Admin Manage" ON public.client_supporting_docs 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser'))
);

-- Service Records Policies (Output Vault)
CREATE POLICY "Records: Client View" ON public.service_records 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Records: Admin full" ON public.service_records 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser'))
);

-- Folders Policies
CREATE POLICY "Folders: Access" ON public.user_folders 
FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser')));

-- ==========================================
-- PART 5: HELPER FUNCTIONS
-- ==========================================

-- 1. Get Folder Path
CREATE OR REPLACE FUNCTION public.get_folder_path(folder_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT := '';
BEGIN
    IF folder_uuid IS NULL THEN RETURN 'My Documents'; END IF;
    
    WITH RECURSIVE folder_tree AS (
        SELECT id, name, parent_folder_id, 1 as level FROM public.user_folders WHERE id = folder_uuid
        UNION ALL
        SELECT f.id, f.name, f.parent_folder_id, ft.level + 1 FROM public.user_folders f
        INNER JOIN folder_tree ft ON f.id = ft.parent_folder_id
    )
    SELECT string_agg(name, ' / ' ORDER BY level DESC) INTO path FROM folder_tree;
    RETURN COALESCE('My Documents / ' || path, 'My Documents');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Count Files (Updated for service_records)
CREATE OR REPLACE FUNCTION public.count_folder_files(folder_uuid UUID, include_subfolders BOOLEAN DEFAULT FALSE)
RETURNS INTEGER AS $$
DECLARE
    file_count INTEGER;
BEGIN
    IF NOT include_subfolders THEN
        SELECT COUNT(*) INTO file_count FROM public.service_records WHERE folder_id = folder_uuid;
    ELSE
        WITH RECURSIVE folder_tree AS (
            SELECT id FROM public.user_folders WHERE id = folder_uuid
            UNION ALL
            SELECT f.id FROM public.user_folders f INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
        )
        SELECT COUNT(*) INTO file_count FROM public.service_records WHERE folder_id IN (SELECT id FROM folder_tree);
    END IF;
    RETURN COALESCE(file_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PART 6: DATA MIGRATION (RESTORE)
-- ==========================================
-- Restore data from temp table into new distinct tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temp_migration_files') THEN
        
        -- 1. Admin Uploads -> service_records
        INSERT INTO public.service_records (
            user_id, folder_id, file_name, file_url, file_size, file_type, 
            tags, description, uploaded_by, created_at,
            domain, service_names, sub_type, year_type, year
        )
        SELECT 
            user_id, folder_id, file_name, file_url, file_size, file_type, 
            tags, description, uploaded_by, created_at,
            domain, service_names, sub_type, year_type, year
        FROM public.temp_migration_files
        WHERE uploaded_by IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superuser'));

        -- 2. Client Uploads -> client_supporting_docs
        INSERT INTO public.client_supporting_docs (
            user_id, file_name, file_url, file_size, file_type, 
            description, uploaded_by, created_at, status
        )
        SELECT 
            user_id, file_name, file_url, file_size, file_type, 
            description, uploaded_by, created_at, 'pending'
        FROM public.temp_migration_files
        WHERE uploaded_by NOT IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superuser'))
           OR uploaded_by IS NULL;

        -- Cleanup Temp
        DROP TABLE public.temp_migration_files;
    END IF;
END $$;

