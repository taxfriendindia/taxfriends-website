-- ==========================================
-- 04_storage.sql: Storage & Buckets
-- ==========================================

-- Note: Buckets can be created via Dashboard, but these policies secure them.
-- Bucket Name: 'user-documents', 'avatars'

-- 1. USER DOCUMENTS BUCKET
-- Users can only access their own folder (user_id/)
-- Admins can access everything

-- Allow users to upload to their own folder
DROP POLICY IF EXISTS "Storage: Users upload own docs" ON storage.objects;
CREATE POLICY "Storage: Users upload own docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own folder
DROP POLICY IF EXISTS "Storage: Users view own docs" ON storage.objects;
CREATE POLICY "Storage: Users view own docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to manage everything in user-documents
DROP POLICY IF EXISTS "Storage: Admins manage all docs" ON storage.objects;
CREATE POLICY "Storage: Admins manage all docs" ON storage.objects
FOR ALL USING (
  bucket_id = 'user-documents' AND
  public.is_admin()
);

-- 2. AVATARS BUCKET
-- Publicly readable, owner writable

DROP POLICY IF EXISTS "Storage: Avatars public read" ON storage.objects;
CREATE POLICY "Storage: Avatars public read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Storage: Users upload own avatar" ON storage.objects;
CREATE POLICY "Storage: Users upload own avatar" ON storage.objects
FOR ALL USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
