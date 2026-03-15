CREATE TABLE IF NOT EXISTS public.commissions (
    id text PRIMARY KEY,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    affiliate_id text REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id text PRIMARY KEY,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    affiliate_id text REFERENCES public.affiliates(id) ON DELETE CASCADE,
    referred_email text,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;
