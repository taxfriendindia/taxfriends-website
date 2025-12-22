-- Function to clear ALL processed payout requests (completed and rejected)
CREATE OR REPLACE FUNCTION public.clear_processed_payouts()
RETURNS void AS $$
BEGIN
    -- Delete both settled and rejected payout requests
    DELETE FROM public.payout_requests
    WHERE status IN ('completed', 'rejected');
    
    -- Cleanup associated document records
    DELETE FROM public.user_documents
    WHERE status IN ('completed', 'rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to globally clear all earning/royalty history records
CREATE OR REPLACE FUNCTION public.clear_all_earning_history()
RETURNS void AS $$
BEGIN
    DELETE FROM public.partner_royalties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear all royalty/history for a specific partner
CREATE OR REPLACE FUNCTION public.clear_partner_history(target_partner_id UUID)
RETURNS void AS $$
BEGIN
    -- Delete royalties for this partner
    DELETE FROM public.partner_royalties
    WHERE partner_id = target_partner_id;
    
    -- Delete payout requests for this partner
    DELETE FROM public.payout_requests
    WHERE partner_id = target_partner_id;
    
    -- Delete notification history
    DELETE FROM public.notifications
    WHERE user_id = target_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fallback for existing UI calls that might still use rejected_payouts
CREATE OR REPLACE FUNCTION public.clear_rejected_payouts()
RETURNS void AS $$
BEGIN
    PERFORM public.clear_processed_payouts();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Super Reset Button logic: Removes everything except user logins/profiles
CREATE OR REPLACE FUNCTION public.super_reset_system()
RETURNS void AS $$
BEGIN
    -- 1. Wipe all transactional/history tables
    DELETE FROM public.partner_royalties WHERE true;
    DELETE FROM public.payout_requests WHERE true;
    DELETE FROM public.user_services WHERE true;
    DELETE FROM public.user_documents WHERE true;
    DELETE FROM public.notifications WHERE true;
    DELETE FROM public.reviews WHERE true;

    -- 2. Reset wallet balances and status to fresh state for all users
    UPDATE public.profiles
    SET 
        wallet_balance = 0,
        kyc_status = 'not_started';
        
    -- Note: This function preserves the 'profiles' records themselves 
    -- and their roles (Admin, Client, Partner) so logout/re-login isn't required.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
