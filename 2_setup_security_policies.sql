-- SCRIPT 2: SECURITY, PERMISSIONS & STORAGE
-- Run this script SECOND. It handles all "Who can see what" logic and creates the Storage Bucket.

-- A. CLEANUP OLD POLICIES (To prevent conflicts)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "ADMIN_FULL_ACCESS" ON public.profiles;
DROP POLICY IF EXISTS "USER_SELF_ACCESS" ON public.profiles;

-- B. PROFILE TABLE POLICIES -------------------------

-- 1. ADMIN POLICY: Admins can View, Edit, Delete ALL profiles
CREATE POLICY "ADMIN_FULL_ACCESS" 
ON public.profiles 
FOR ALL 
USING (auth.email() = 'taxfriend.tax@gmail.com');

-- 2. USER POLICY: Users can only View/Edit their OWN profile
CREATE POLICY "USER_SELF_ACCESS" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- C. STORAGE BUCKET CREATION & POLICIES ----------------

-- 1. Auto-Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop old storage policies to ensure clean slate
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 3. Public View Access (Anyone can see images)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. User Upload Access (Restrict to own folder/file)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- 5. User Update/Delete Access
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
   bucket_id = 'avatars' AND
   auth.uid() = owner
);

-- D. GRANTS
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
