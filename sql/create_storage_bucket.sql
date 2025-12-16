-- Create the storage bucket 'client-docs'
insert into storage.buckets (id, name, public) values ('client-docs', 'client-docs', false);

-- Enable RLS for the bucket
-- 1. VIEW: Users can view their own folder (based on user_id in path? No, path is tricky. Let's simplify: Any authenticated user can view? No.)
-- Better: Users can view objects where owner = auth.uid()
create policy "Users can view own files"
on storage.objects for select
using ( bucket_id = 'client-docs' and auth.uid() = owner );

-- 2. UPLOAD: Users can upload to their own folder, restrict to 200KB (approx 204800 bytes) ideally in frontend, but here too?
-- Supabase policy for size is harder. We rely on frontend for strict 200KB limit.
create policy "Users can upload files"
on storage.objects for insert
with check ( bucket_id = 'client-docs' and auth.uid() = owner );

-- 3. DELETE: BLOCKED for Users (as per request "safe from accidental deletion")
-- Only Admins can delete
create policy "Admins can delete any file"
on storage.objects for delete
using (
  bucket_id = 'client-docs' 
  and exists (
    select 1 from public.profiles 
    where id = auth.uid() and (role = 'admin' or role = 'superuser')
  )
);

-- 4. ADMIN VIEW: Admins can view ALL files
create policy "Admins can view all files"
on storage.objects for select
using (
  bucket_id = 'client-docs' 
  and exists (
    select 1 from public.profiles 
    where id = auth.uid() and (role = 'admin' or role = 'superuser')
  )
);
