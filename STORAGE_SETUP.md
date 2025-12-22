# Storage Setup Guide

## Creating Storage Buckets in Supabase

To enable document uploads, you need to create storage buckets in your Supabase project:

### 1. Create 'user-documents' Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter bucket name: `user-documents`
5. Set **Public bucket**: OFF (private)
6. Click **"Create bucket"**

### 2. Create 'avatars' Bucket

1. Click **"New bucket"** again
2. Enter bucket name: `avatars`
3. Set **Public bucket**: ON (public)
4. Click **"Create bucket"**

### 3. Apply Storage Policies

Run the SQL file to set up proper access policies:

```bash
# In Supabase SQL Editor, run:
supabase/clean_sql/04_storage.sql
```

This will:
- Allow users to upload documents to their own folder
- Allow admins to access all documents
- Make avatars publicly readable

### 4. Verify Setup

After creating the buckets and applying policies:
- Partners can upload client documents during onboarding
- Documents are stored securely with proper access control
- Avatars are publicly accessible for profile pictures

## Note

The application will continue to work even if storage is not configured. Document uploads will be skipped gracefully, and you can set up storage later without breaking existing functionality.
