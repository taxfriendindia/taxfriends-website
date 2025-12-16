-- =========================================================
-- FILE 1: AUTH & PROFILES SETUP (FINAL FIX)
-- Run this FIRST. It handles "Already Exists" errors automatically.
-- =========================================================

-- 1. Create Profiles Table (Linked to Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  mobile text,
  role text default 'user',
  avatar_url text,
  gst_number text,
  organization text,
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
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone
);

-- 2. Enable Security
alter table public.profiles enable row level security;

-- 3. Trigger: Automatically Create Profile on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'user', -- Default role
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. POLICIES (PERMISSIONS)
-- IMPORTANT: We drop them first to prevent "Already Exists" errors.

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles for delete using (
  auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
);

-- 5. Helper: Ensure Admin exists in profiles
insert into public.profiles (id, full_name, email, role)
select id, 'System Admin', email, 'admin'
from auth.users
where email = 'taxfriend.tax@gmail.com'
and not exists (select 1 from public.profiles where email = 'taxfriend.tax@gmail.com');
