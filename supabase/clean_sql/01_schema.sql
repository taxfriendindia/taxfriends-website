-- ==========================================
-- 01_schema.sql: Core Database Structure
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles (Central User Table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Removed direct REFERENCES to allow shadow profiles
    email TEXT UNIQUE,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superuser', 'partner')),
    
    -- Personal details
    full_name TEXT,
    dob DATE,
    mothers_name TEXT,
    mobile_number TEXT,
    avatar_url TEXT,

    -- Address Details
    residential_address TEXT,
    residential_city TEXT,
    residential_state TEXT,
    residential_pincode TEXT,

    -- Business details
    business_name TEXT,
    organization TEXT,
    gst_number TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_pincode TEXT,

    -- Tracking / Partner Info
    partner_id UUID REFERENCES public.profiles(id) ON UPDATE CASCADE,
    wallet_balance NUMERIC DEFAULT 0,
    payout_upi TEXT,
    kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Catalog (The "Menu")
CREATE TABLE IF NOT EXISTS public.service_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT, 
    price_range TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Services (The "Orders")
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'quality_check', 'completed', 'rejected', 'cancelled')),
    comments TEXT, -- Admin notes
    handled_by UUID REFERENCES public.profiles(id) ON UPDATE CASCADE, -- Admin/Sudo who is handling this
    partner_id UUID REFERENCES public.profiles(id) ON UPDATE CASCADE, -- Partner responsible if assisted
    is_assisted_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE, -- NULL for broadcast
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'reminder', 'broadcast')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Documents (Submissions)
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT, 
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    doc_type TEXT, -- 'adhar', 'pan', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Royalties (Earnings)
CREATE TABLE IF NOT EXISTS public.partner_royalties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    service_id UUID REFERENCES public.user_services(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('direct', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Requests (Manual Workflow)
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    method TEXT DEFAULT 'UPI',
    recipient_details TEXT, -- UPI ID or reference
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_payout_requests_partner ON public.payout_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_services_user ON public.user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.user_documents(user_id);
