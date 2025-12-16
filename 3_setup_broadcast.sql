-- =========================================================
-- FILE 3: BROADCAST & NOTIFICATIONS (FINAL FIX)
-- Run this THIRD. It handles "Already Exists" errors automatically.
-- =========================================================

-- 1. Create Notifications Table
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


-- 2. POLICIES (PERMISSIONS) FOR NOTIFICATIONS

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications" on public.notifications for insert
  with check (
    auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
  );

drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications" on public.notifications for select
  using (
    auth.uid() in (select id from auth.users where email = 'taxfriend.tax@gmail.com')
  );
