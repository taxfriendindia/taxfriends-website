-- ==========================================
-- SCRIPT 5: FIX PERMISSIONS AND NOTIFICATIONS
-- Run this ENTIRE SCRIPT in Supabase SQL Editor
-- ==========================================

-- 1. NOTIFICATIONS TABLE SETUP
-- First, ensure the table exists
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Security)
alter table public.notifications enable row level security;

-- 2. RESET POLICIES (Fixes "policy already exists" error)
-- We drop them first to ensure a clean slate
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- 3. CREATE NEW POLICIES
-- Policy: Users see their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Policy: Admin (taxfriend.tax@gmail.com) can send (insert) notifications to ANYONE
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (
    auth.uid() in (
      select id from auth.users where email = 'taxfriend.tax@gmail.com'
    )
  );

-- Policy: Admin can view all notifications
create policy "Admins can view all notifications"
  on public.notifications for select
  using (
    auth.uid() in (
      select id from auth.users where email = 'taxfriend.tax@gmail.com'
    )
  );

-- Policy: Admin can view ALL profiles (Critical for Broadcast to work)
-- This ensures fetching 'users' list doesn't return empty or 0
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    auth.uid() in (
      select id from auth.users where email = 'taxfriend.tax@gmail.com'
    )
  );

-- 4. BACKFILL PROFILES (Optional but Recommended)
-- If you have users in Auth but missing in Profiles, this adds them.
insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data->>'full_name', email
from auth.users
where id not in (select id from public.profiles);
