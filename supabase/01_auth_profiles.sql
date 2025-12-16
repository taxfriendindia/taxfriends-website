-- SQL 1: User Identity & Roles (ROBUST VERSION)
-- Fixes: Infinite Recursion, Permission Denied, Missing Columns.

-- 1. Create Profiles Table (If not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superuser')),
  
  -- Personal Information
  full_name TEXT,
  dob DATE,
  mothers_name TEXT,
  mobile_number TEXT,
  email TEXT, 
  avatar_url TEXT,

  -- Residential Address
  residential_address TEXT,
  residential_city TEXT,
  residential_state TEXT,
  residential_pincode TEXT,

  -- Business Details
  business_name TEXT, 
  organization TEXT,
  gst_number TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_pincode TEXT,

  -- General Location
  state TEXT,
  city TEXT,
  pincode TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Secure Role Checker Function (Prevents Recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Security Definer allows this to run with elevated privileges, bypassing RLS
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Clean Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'superuser')
  );

DROP POLICY IF EXISTS "Superuser can update roles" ON public.profiles;

DROP POLICY IF EXISTS "Superusers can update any profile" ON public.profiles;
CREATE POLICY "Superusers can update any profile" ON public.profiles
  FOR UPDATE USING (
    public.get_my_role() = 'superuser'
  );

-- 5. Trigger for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'taxfriend.tax@gmail.com' THEN 'superuser'
      ELSE 'client'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
