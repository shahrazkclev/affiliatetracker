-- ============================================================
-- Migration: Fix tables for PromoteKit sync
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add last_synced_at to affiliates (if missing)
ALTER TABLE public.affiliates 
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- 2. Recreate commissions with correct columns
-- (The existing table likely has commission_amount & referral_id)
-- We add 'amount' as alias column if missing:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='commissions' AND column_name='amount'
  ) THEN
    ALTER TABLE public.commissions ADD COLUMN amount NUMERIC(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Ensure referrals has referred_email (might be customer_email)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='referrals' AND column_name='referred_email'
  ) THEN
    ALTER TABLE public.referrals ADD COLUMN referred_email TEXT;
  END IF;
END $$;

-- 4. Create payouts table (PromoteKit payouts)
CREATE TABLE IF NOT EXISTS public.payouts (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    affiliate_id TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    period TIMESTAMP WITH TIME ZONE,
    payment_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on payouts for now (admin-only table)
ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;

-- 5. Disable RLS on commissions & referrals temporarily for sync
-- (Re-enable with proper policies after sync works)
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;

-- 6. Show resulting columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('affiliates', 'commissions', 'referrals', 'payouts')
ORDER BY table_name, ordinal_position;

-- 7. Add notification preferences to affiliates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='affiliates' AND column_name='notify_new_referral'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN notify_new_referral BOOLEAN DEFAULT true;
    ALTER TABLE public.affiliates ADD COLUMN notify_new_commission BOOLEAN DEFAULT true;
    ALTER TABLE public.affiliates ADD COLUMN notify_payout_generated BOOLEAN DEFAULT true;
    ALTER TABLE public.affiliates ADD COLUMN notify_account_approved BOOLEAN DEFAULT true;
    ALTER TABLE public.affiliates ADD COLUMN notify_account_revision BOOLEAN DEFAULT true;
  END IF;
END $$;

-- --------------------------------------------------------
-- Webhooks for Email Notifications
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net CASCADE;

CREATE OR REPLACE FUNCTION public.send_webhook()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  payload = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN null ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN null ELSE row_to_json(OLD) END
  );

  PERFORM net.http_post(
    url := 'https://ahpfekhoaariwtghswit.supabase.co/functions/v1/send-email-notification',
    body := payload,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb
  );
  
  RETURN coalesce(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_commission_created ON public.commissions;
CREATE TRIGGER on_commission_created
AFTER INSERT ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.send_webhook();

DROP TRIGGER IF EXISTS on_referral_created ON public.referrals;
CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.send_webhook();

DROP TRIGGER IF EXISTS on_payout_created ON public.payouts;
CREATE TRIGGER on_payout_created
AFTER INSERT ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.send_webhook();

DROP TRIGGER IF EXISTS on_affiliate_updated ON public.affiliates;
CREATE TRIGGER on_affiliate_updated
AFTER UPDATE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.send_webhook();
