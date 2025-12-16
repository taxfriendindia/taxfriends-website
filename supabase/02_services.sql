-- SQL 2: Services & Catalog (ROBUST VERSION)

-- 1. Create Service Catalog (The "Menu")
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, 
  price_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view catalog" ON public.service_catalog;
CREATE POLICY "Public can view catalog" ON public.service_catalog
  FOR SELECT USING (true);


-- 2. Create User Services (The "Orders")
CREATE TABLE IF NOT EXISTS public.user_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID, 
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'quality_check', 'completed', 'rejected', 'cancelled')),
  comments TEXT, -- Admin notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- Policies for User Services
DROP POLICY IF EXISTS "Users can view own services" ON public.user_services;
CREATE POLICY "Users can view own services" ON public.user_services
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create services" ON public.user_services;
CREATE POLICY "Users can create services" ON public.user_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all services" ON public.user_services;
CREATE POLICY "Admins can view all services" ON public.user_services
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'superuser')
  );

DROP POLICY IF EXISTS "Admins can update services" ON public.user_services;
CREATE POLICY "Admins can update services" ON public.user_services
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'superuser')
  );


-- 3. Admin Dashboard View
CREATE OR REPLACE VIEW public.admin_client_view AS
SELECT 
  p.id,
  p.full_name,
  p.business_name,
  p.state,
  p.city,
  p.mobile_number,
  p.email,
  p.role,
  p.created_at,
  COUNT(us.id) as total_requests,
  SUM(CASE WHEN us.status IN ('pending', 'processing') THEN 1 ELSE 0 END) as pending_requests
FROM public.profiles p
LEFT JOIN public.user_services us ON p.id = us.user_id
GROUP BY p.id;
