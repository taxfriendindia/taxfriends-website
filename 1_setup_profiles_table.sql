-- SCRIPT 1: CLEANUP & PROFILES TABLE SETUP
-- Run this script FIRST to set up the core user profile structure.

-- 1. Create the PROFILES table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  mobile TEXT,
  avatar_url TEXT,
  
  -- Personal Details
  dob DATE,
  mothers_name TEXT,

  -- Residential Address
  residential_address TEXT,
  residential_city TEXT,
  residential_state TEXT,
  residential_pincode TEXT,

  -- Business Details & Address
  organization TEXT, -- Business Name
  gst_number TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_pincode TEXT,

  -- Backwards Compatibility (Deprecated but kept to avoid breaking old queries temporarily)
  city TEXT,
  state TEXT,
  pincode TEXT,

  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add any missing columns safely (if table already existed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mothers_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residential_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residential_state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residential_pincode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_pincode TEXT;

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Set up Auto-Creation of Profile on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
