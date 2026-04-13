-- Supabase Schema for Affiliate Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    stripe_account_id TEXT, -- For Stripe Connect or manual reference
    custom_domain TEXT,
    terms_url TEXT,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_commission_percent DECIMAL NOT NULL, -- e.g. 30.0
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Affiliates
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to Supabase Auth
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    name TEXT,
    email TEXT,
    referral_code TEXT UNIQUE NOT NULL, -- e.g. "test", "chap1course"
    payout_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Referrals (Customers brought in by Affiliates)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'trialing', -- 'trialing', 'paying', etc.
    sub_id TEXT, -- Custom tracking tag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Commissions
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES referrals(id),
    stripe_charge_id TEXT UNIQUE NOT NULL,
    revenue DECIMAL NOT NULL, -- Total revenue from the charge
    commission_amount DECIMAL NOT NULL, -- Calculated commission
    status TEXT DEFAULT 'pending', -- 'pending' (Not Paid Out), 'paid' (Paid Out)
    sub_id TEXT, -- Custom tracking tag
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Setup

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Note: In a production app you would define specific Policies here.
-- For the sake of this setup, we will create permissive policies for authenticated users 
-- (Assuming the Admin has access to the Org, and Affiliates only see their own records).

-- Example: Affiliates can see their own data
CREATE POLICY "Affiliates can view their own profile" 
ON affiliates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can view their referrals" 
ON referrals FOR SELECT 
USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);

CREATE POLICY "Affiliates can view their commissions" 
ON commissions FOR SELECT 
USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);
