-- SQL Fixes: Deduplicate Services & Fix Avatar Storage

-- 1. Deduplicate Service Catalog
-- Identify duplicates by title and delete all but the instance with the earliest created_at
DELETE FROM public.service_catalog
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (partition BY title ORDER BY created_at ASC) as rnum
    FROM public.service_catalog
  ) t
  WHERE t.rnum > 1
);

-- 2. Add Unique Constraint to prevent future duplicates
ALTER TABLE public.service_catalog 
ADD CONSTRAINT service_catalog_title_key UNIQUE (title);

-- 3. Storage for Avatars
-- Insert 'avatars' bucket if it doesn't exist, and ensure it is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage Policies
-- Remove potential existing conflicting policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- a. Public Access (View)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- b. Upload Access (Authenticated Users)
-- Allows any authenticated user to upload to the 'avatars' bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- c. Update Access
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- d. Delete Access
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
