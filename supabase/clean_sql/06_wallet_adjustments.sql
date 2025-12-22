-- ==========================================
-- 06_wallet_adjustments.sql
-- ==========================================

-- 1. Modify partner_royalties to allow manual adjustments
-- Make service_id and client_id nullable for adjustments
ALTER TABLE public.partner_royalties ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE public.partner_royalties ALTER COLUMN client_id DROP NOT NULL;

-- Update type constraint to include 'adjustment'
ALTER TABLE public.partner_royalties DROP CONSTRAINT IF EXISTS partner_royalties_type_check;
ALTER TABLE public.partner_royalties ADD CONSTRAINT partner_royalties_type_check CHECK (type IN ('direct', 'referral', 'adjustment'));

-- 2. RPC to safely adjust wallet and log royalty record
CREATE OR REPLACE FUNCTION public.adjust_partner_wallet(
    target_partner_id UUID,
    adjustment_amount NUMERIC,
    adjustment_reason TEXT,
    admin_id UUID
)
RETURNS void AS $$
DECLARE
    current_bal NUMERIC;
BEGIN
    -- Check if executer is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can adjust wallets';
    END IF;

    -- Get current balance
    SELECT wallet_balance INTO current_bal FROM public.profiles WHERE id = target_partner_id;
    IF current_bal IS NULL THEN
        RAISE EXCEPTION 'Partner not found';
    END IF;

    -- Update profile balance
    UPDATE public.profiles
    SET wallet_balance = current_bal + adjustment_amount,
        updated_at = NOW()
    WHERE id = target_partner_id;

    -- Log transaction in partner_royalties
    INSERT INTO public.partner_royalties (
        partner_id,
        amount,
        type,
        status,
        verified_at,
        created_at
    ) VALUES (
        target_partner_id,
        adjustment_amount,
        'adjustment',
        'available',
        NOW(),
        NOW()
    );

    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        target_partner_id,
        CASE WHEN adjustment_amount > 0 THEN 'Wallet Credited' ELSE 'Wallet Debited' END,
        CASE 
            WHEN adjustment_amount > 0 THEN '₹' || adjustment_amount || ' has been added to your wallet.'
            ELSE '₹' || ABS(adjustment_amount) || ' has been deducted from your wallet. Reason: ' || adjustment_reason
        END,
        CASE WHEN adjustment_amount > 0 THEN 'success' ELSE 'warning' END,
        FALSE,
        NOW()
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
