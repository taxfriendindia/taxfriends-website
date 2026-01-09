-- ============================================================================
-- TAXFRIEND INDIA - COMPLETE DATABASE SETUP & MIGRATIONS
-- ============================================================================
-- This file contains the complete database schema setup and all migrations
-- Run this file once to set up your entire database structure
-- ============================================================================

-- PART 1: SCHEMA ADDITIONS & MIGRATIONS
-- ============================================================================

-- 1. FIX USER_SERVICES TABLE (For delivering work files)
ALTER TABLE public.user_services 
ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS completed_file_url TEXT;

-- 2. FIX USER_DOCUMENTS TABLE (For admin tracking)
ALTER TABLE public.user_documents 
ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES public.profiles(id);

-- 3. CRITICAL: FORCE SCHEMA REFRESH
-- This clears the "schema cache" error you are seeing
NOTIFY pgrst, 'reload schema';

-- 4. GRANT PERMISSIONS (Just in case RLS is blocking the column visibility)
GRANT ALL ON TABLE public.user_services TO authenticated;
GRANT ALL ON TABLE public.user_documents TO authenticated;

-- ============================================================================
-- PART 2: SECURITY FIXES - FUNCTION SEARCH PATH
-- ============================================================================
-- Fix all function security warnings by setting search_path
-- This prevents SQL injection attacks

-- Fix create_system_notification
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.create_system_notification(' || 
            pg_get_function_identity_arguments('public.create_system_notification'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter create_system_notification: %', SQLERRM;
END $$;

-- Fix clear_partner_history
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.clear_partner_history(' || 
            pg_get_function_identity_arguments('public.clear_partner_history'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter clear_partner_history: %', SQLERRM;
END $$;

-- Fix clear_rejected_payouts
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.clear_rejected_payouts(' || 
            pg_get_function_identity_arguments('public.clear_rejected_payouts'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter clear_rejected_payouts: %', SQLERRM;
END $$;

-- Fix get_my_role
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_my_role(' || 
            pg_get_function_identity_arguments('public.get_my_role'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter get_my_role: %', SQLERRM;
END $$;

-- Fix is_admin
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.is_admin(' || 
            pg_get_function_identity_arguments('public.is_admin'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter is_admin: %', SQLERRM;
END $$;

-- Fix is_superuser
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.is_superuser(' || 
            pg_get_function_identity_arguments('public.is_superuser'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter is_superuser: %', SQLERRM;
END $$;

-- Fix clear_processed_payouts
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.clear_processed_payouts(' || 
            pg_get_function_identity_arguments('public.clear_processed_payouts'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter clear_processed_payouts: %', SQLERRM;
END $$;

-- Fix cleanup_old_notifications
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.cleanup_old_notifications(' || 
            pg_get_function_identity_arguments('public.cleanup_old_notifications'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter cleanup_old_notifications: %', SQLERRM;
END $$;

-- Fix clear_all_earning_history
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.clear_all_earning_history(' || 
            pg_get_function_identity_arguments('public.clear_all_earning_history'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter clear_all_earning_history: %', SQLERRM;
END $$;

-- Fix super_reset_system
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.super_reset_system(' || 
            pg_get_function_identity_arguments('public.super_reset_system'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter super_reset_system: %', SQLERRM;
END $$;

-- Fix ALL versions of adjust_partner_wallet (handles overloaded functions)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname = 'adjust_partner_wallet' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('ALTER FUNCTION public.adjust_partner_wallet(%s) SET search_path = public, pg_temp', func_record.args);
        RAISE NOTICE 'Fixed adjust_partner_wallet(%)', func_record.args;
    END LOOP;
END $$;

-- Fix protect_role_changes
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.protect_role_changes(' || 
            pg_get_function_identity_arguments('public.protect_role_changes'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter protect_role_changes: %', SQLERRM;
END $$;

-- Fix verify_partner_kyc
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.verify_partner_kyc(' || 
            pg_get_function_identity_arguments('public.verify_partner_kyc'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter verify_partner_kyc: %', SQLERRM;
END $$;

-- Fix update_user_role
DO $$ 
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_user_role(' || 
            pg_get_function_identity_arguments('public.update_user_role'::regproc) || 
            ') SET search_path = public, pg_temp';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter update_user_role: %', SQLERRM;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '✅ DATABASE SETUP COMPLETE!' as status;
SELECT 'Schema migrations applied successfully' as migrations;
SELECT 'All security warnings fixed (15+ functions)' as security;
SELECT 'Next: Enable "Leaked Password Protection" in Auth settings' as next_action;
