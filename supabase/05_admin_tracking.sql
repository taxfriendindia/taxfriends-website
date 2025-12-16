-- 1. Add admin_id to user_services to track who processed the request
ALTER TABLE public.user_services 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_user_services_admin_id ON public.user_services(admin_id);

-- 2. Ensure Admins can DELETE services (Missing in original schema)
DROP POLICY IF EXISTS "Admins can delete services" ON public.user_services;
CREATE POLICY "Admins can delete services" ON public.user_services 
FOR DELETE USING (
  public.get_my_role() IN ('admin', 'superuser')
);
