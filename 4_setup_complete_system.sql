-- =========================================================
-- TAXFRIENDS COMPLETE DATABASE SETUP & PERMISSIONS FIX
-- Run this ENTIRE file in Supabase SQL Editor to fix everything.
-- =========================================================

-- 1. SETUP TABLES (If they don't exist) & ENABLE RLS
-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  mobile text,
  role text default 'user',
  avatar_url text,
  updated_at timestamp with time zone,
  -- Additional profile fields
  dob date,
  mothers_name text, 
  residential_address text,
  residential_city text,
  residential_state text,
  residential_pincode text,
  business_address text,
  business_city text,
  business_state text,
  business_pincode text,
  gst_number text,
  organization text
);
alter table public.profiles enable row level security;

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notifications enable row level security;

-- Services & Documents (Ensure RLS is on)
alter table public.user_services enable row level security;
alter table public.user_documents enable row level security;


-- 2. RESET: DROP ALL EXISTING POLICIES
-- This ensures we don't get "policy already exists" errors
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

drop policy if exists "Users can view own services" on public.user_services;
drop policy if exists "Users can insert own services" on public.user_services;
drop policy if exists "Admins can view all services" on public.user_services;
drop policy if exists "Admins can update services" on public.user_services;

drop policy if exists "Users can view own documents" on public.user_documents;
drop policy if exists "Users can upload documents" on public.user_documents;
drop policy if exists "Admins can view all documents" on public.user_documents;
drop policy if exists "Admins can update documents" on public.user_documents;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;


-- 3. APPLY CORRECT POLICIES

-- === A. PROFILES ===
-- Users: Can Read, Update, and Insert their OWN profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Admins (taxfriend.tax@gmail.com): Can Read & Delete ALL profiles
create policy "Admins can view all profiles" on public.profiles for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);
create policy "Admins can delete profiles" on public.profiles for delete using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);


-- === B. NOTIFICATIONS ===
-- Users: Can Read OWN notifications
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);

-- Admins: Can Send (Insert) & Read ALL notifications
create policy "Admins can insert notifications" on public.notifications for insert with check (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);
create policy "Admins can view all notifications" on public.notifications for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);


-- === C. SERVICES ===
-- Users: Can Read & Request (Insert) OWN services
create policy "Users can view own services" on public.user_services for select using (auth.uid() = user_id);
create policy "Users can insert own services" on public.user_services for insert with check (auth.uid() = user_id);

-- Admins: Can Read & Update (Change Status) ALL services
create policy "Admins can view all services" on public.user_services for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);
create policy "Admins can update services" on public.user_services for update using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);


-- === D. DOCUMENTS ===
-- Users: Can Read & Upload (Insert) OWN documents
create policy "Users can view own documents" on public.user_documents for select using (auth.uid() = user_id);
create policy "Users can upload documents" on public.user_documents for insert with check (auth.uid() = user_id);

-- Admins: Can Read & Update (Verify) ALL documents
create policy "Admins can view all documents" on public.user_documents for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);
create policy "Admins can update documents" on public.user_documents for update using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);


-- 4. FIX MISSING PROFILES
-- Ensure the Main Admin has a profile so RLS works
insert into public.profiles (id, full_name, email, role)
select id, 'System Admin', email, 'admin'
from auth.users
where email = 'taxfriend.tax@gmail.com'
and not exists (select 1 from public.profiles where email = 'taxfriend.tax@gmail.com');

-- Ensure any other users have profiles
insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data->>'full_name', email
from auth.users
where id not in (select id from public.profiles);
