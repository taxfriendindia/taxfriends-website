-- ==========================================
-- 05_seed.sql: Initial Data
-- ==========================================

-- 1. POPULATE SERVICE CATALOG
-- Using titles that match the priority order for better sorting and deduplication
INSERT INTO public.service_catalog (title, description, icon, price_range)
VALUES 
('GST Registration', 'Initial registration for Goods and Services Tax.', 'Building2', '₹999 - ₹1999'),
('GST Return Filing', 'Monthly/Quarterly compliance for GST.', 'Send', '₹499 - ₹999'),
('Income Tax Filing', 'Personal or Business ITR filing.', 'Calculator', '₹999 - ₹4999'),
('TDS Filing', 'Tax Deducted at Source returns.', 'Layers', '₹799 - ₹1499'),
('Company Incorporation', 'Pvt Ltd, LLP, or OPC formation.', 'Rocket', '₹4999 - ₹9999'),
('Trademark Registration', 'Intellectual property protection.', 'Award', '₹2999 - ₹5999')
ON CONFLICT DO NOTHING;

-- 2. ENSURE MASTER ADMIN EXISTS
-- Note: This requires the user to have signed up via Auth first.
-- This script just ensures their profile has the correct role.
UPDATE public.profiles 
SET role = 'superuser' 
WHERE email = 'taxfriend.tax@gmail.com';
