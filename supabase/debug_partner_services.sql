-- DEBUG: Check service visibility for partners
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check all services in the system
SELECT 
    us.id,
    us.created_at,
    us.status,
    us.partner_id,
    us.user_id,
    us.is_assisted_service,
    c.full_name as client_name,
    c.partner_id as client_partner_id,
    s.title as service_title
FROM user_services us
LEFT JOIN profiles c ON us.user_id = c.id
LEFT JOIN service_catalog s ON us.service_id = s.id
ORDER BY us.created_at DESC
LIMIT 20;

-- 2. Check if RLS is blocking partner access
-- Replace 'PARTNER_ID_HERE' with actual partner ID
SELECT 
    us.*,
    c.full_name,
    c.partner_id as client_partner
FROM user_services us
LEFT JOIN profiles c ON us.user_id = c.id
WHERE us.partner_id = 'PARTNER_ID_HERE' 
   OR c.partner_id = 'PARTNER_ID_HERE';

-- 3. Check profiles to see partner relationships
SELECT 
    id,
    full_name,
    email,
    role,
    partner_id,
    created_at
FROM profiles
WHERE role IN ('client', 'partner')
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check if there are orphaned services (no partner_id and client has no partner_id)
SELECT 
    us.id,
    us.created_at,
    us.status,
    us.partner_id as service_partner,
    c.full_name,
    c.partner_id as client_partner,
    s.title
FROM user_services us
LEFT JOIN profiles c ON us.user_id = c.id
LEFT JOIN service_catalog s ON us.service_id = s.id
WHERE us.partner_id IS NULL AND c.partner_id IS NULL;
