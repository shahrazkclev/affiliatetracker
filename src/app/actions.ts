'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Check if the user has clicked the confirmation link in their email */
export async function checkEmailConfirmed(email: string): Promise<{ confirmed: boolean; error?: string }> {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc('check_email_confirmed', { user_email: email });
    if (error) return { confirmed: false, error: 'Could not check status.' };
    return { confirmed: !!data };
}

/** Step 1 of sign-up: send confirmation link email before showing the application form */
export async function sendSignupConfirmation(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    // Check if already registered as an affiliate
    const { data: existingAffiliate } = await admin
        .from('affiliates')
        .select('id, status')
        .eq('email', email)
        .maybeSingle();

    if (existingAffiliate) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    // Send confirmation link — on click it redirects to /auth/callback
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            emailRedirectTo: `${SITE_URL}/auth/callback?next=/apply/details`,
        },
    });

    if (error) return { error: error.message };
    return {};
}

/** Submit affiliate application after email is confirmed (session required) */
export async function submitAffiliateApplication(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Session expired. Please start over.' };

    const name = (formData.get('name') as string)?.trim();
    const referralCode = (formData.get('referralCode') as string)?.trim().toLowerCase().replace(/\s+/g, '');

    if (!name || !referralCode) return { error: 'All fields are required.' };

    // Check referral code uniqueness
    const { data: taken } = await admin
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

    if (taken) return { error: 'That referral code is taken. Please choose another.' };

    const { data: campaign } = await admin
        .from('campaigns')
        .select('id, org_id')
        .eq('is_default', true)
        .maybeSingle();

    const { error: insertError } = await admin.from('affiliates').insert({
        user_id: user.id,
        org_id: campaign?.org_id ?? null,
        campaign_id: campaign?.id ?? null,
        name,
        email: user.email,
        referral_code: referralCode,
        status: 'pending',
    });

    if (insertError) {
        console.error('[submitAffiliateApplication]', insertError);
        return { error: 'Failed to submit: ' + insertError.message };
    }

    redirect('/applied');
}
