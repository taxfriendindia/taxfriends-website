-- Add admin_id to user_services to track who processed the request
ALTER TABLE public.user_services 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_user_services_admin_id ON public.user_services(admin_id);
