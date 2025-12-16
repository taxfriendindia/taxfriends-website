-- Create user_documents table if it acts as a log for email submissions or real uploads
create table if not exists public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_url text, -- Can be a storage URL or 'sent_via_email'
  status text default 'pending', -- 'pending', 'verified', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  doc_type text -- 'adhar', 'pan', 'email_attachment'
);

-- Enable RLS
alter table public.user_documents enable row level security;

-- Policies
-- 1. Users can see their own docs
create policy "Users can view own documents" 
on public.user_documents for select 
using (auth.uid() = user_id);

-- 2. Users can insert their own docs (uploading/logging)
create policy "Users can upload documents" 
on public.user_documents for insert 
with check (auth.uid() = user_id);

-- 3. Users can delete their own docs (optional)
create policy "Users can delete own documents" 
on public.user_documents for delete 
using (auth.uid() = user_id);

-- 4. Admins/Superusers can view ALL documents
create policy "Admins can view all documents" 
on public.user_documents for select 
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'superuser')
  )
);

-- 5. Admins/Superusers can update status (verify/reject)
create policy "Admins can update status" 
on public.user_documents for update 
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'superuser')
  )
);
