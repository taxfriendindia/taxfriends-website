-- SQL 3: Notifications (ROBUST VERSION)

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means broadcast
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'reminder', 'broadcast')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- FIX: Allow users to create notifications for THEMSELVES (e.g. "Service Requested")
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'superuser')
  );

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
