-- Create Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies (Drop existing ones first to avoid contention)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;

-- 1. Users can view their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- 2. Admins can insert/view all notifications
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (
    auth.uid() in (
      select id from auth.users where email = 'taxfriend.tax@gmail.com'
    )
  );

create policy "Admins can view all notifications"
  on public.notifications for select
  using (
    auth.uid() in (
      select id from auth.users where email = 'taxfriend.tax@gmail.com'
    )
  );
