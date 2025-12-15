-- =========================================================
-- FILE 2: SERVICES & DOCUMENTS (FINAL FIX)
-- Run this SECOND. It handles "Already Exists" errors automatically.
-- =========================================================

-- 1. Create Services Table
create table if not exists public.user_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  service_type text not null,
  status text default 'pending',
  description text,
  amount numeric,
  payment_status text default 'unpaid',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.user_services enable row level security;

-- 2. Create Documents Table
create table if not exists public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  service_id uuid references public.user_services(id) on delete set null,
  name text not null,
  file_url text not null,
  file_type text,
  size integer,
  status text default 'uploaded',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.user_documents enable row level security;


-- 3. POLICIES (PERMISSIONS) FOR SERVICES

drop policy if exists "Users can view own services" on public.user_services;
create policy "Users can view own services" on public.user_services for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own services" on public.user_services;
create policy "Users can insert own services" on public.user_services for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all services" on public.user_services;
create policy "Admins can view all services" on public.user_services for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);

drop policy if exists "Admins can update services" on public.user_services;
create policy "Admins can update services" on public.user_services for update using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);


-- 4. POLICIES (PERMISSIONS) FOR DOCUMENTS

drop policy if exists "Users can view own documents" on public.user_documents;
create policy "Users can view own documents" on public.user_documents for select using (auth.uid() = user_id);

drop policy if exists "Users can upload documents" on public.user_documents;
create policy "Users can upload documents" on public.user_documents for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all documents" on public.user_documents;
create policy "Admins can view all documents" on public.user_documents for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);

drop policy if exists "Admins can update documents" on public.user_documents;
create policy "Admins can update documents" on public.user_documents for update using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);
