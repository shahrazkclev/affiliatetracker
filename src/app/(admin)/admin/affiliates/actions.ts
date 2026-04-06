'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/** Directly add an affiliate (no email invite — sets status active immediately) */
export async function addAffiliateDirectly(formData: FormData): Promise<{ error?: string }> {
    const admin = getAdminClient();

    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const referralCode = (formData.get('referralCode') as string)?.trim().toLowerCase().replace(/\s+/g, '');
    const campaignId = formData.get('campaign_id') as string || null;
    const stripePromoId = (formData.get('stripe_promo_id') as string)?.trim() || null;
    const stripePromoCode = (formData.get('stripe_promo_code') as string)?.trim() || null;

    if (!name || !email || !referralCode) return { error: 'Name, email, and referral code are required.' };

    // Check email not already taken
    const { data: existingAffiliate } = await admin
        .from('affiliates').select('id').eq('email', email).maybeSingle();
    if (existingAffiliate) return { error: 'An affiliate with this email already exists.' };

    // Check referral code not already taken
    const { data: taken } = await admin
        .from('affiliates').select('id').eq('referral_code', referralCode).maybeSingle();
    if (taken) return { error: 'That referral code is already taken.' };

    // Get org_id from campaign, or from default campaign
    let orgId: string | null = null;
    if (campaignId) {
        const { data: camp } = await admin.from('campaigns').select('org_id').eq('id', campaignId).maybeSingle();
        orgId = camp?.org_id ?? null;
    } else {
        const { data: defCamp } = await admin.from('campaigns').select('id, org_id').eq('is_default', true).maybeSingle();
        orgId = defCamp?.org_id ?? null;
    }

    // Create auth user (no password — they'll set it on first login via magic link)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
    });
    if (authError || !authData.user) return { error: authError?.message || 'Could not create account.' };

    const { error: insertError } = await admin.from('affiliates').insert({
        user_id: authData.user.id,
        org_id: orgId,
        campaign_id: campaignId || null,
        name,
        email,
        referral_code: referralCode,
        status: 'active', // immediately active when admin adds directly
        stripe_promo_id: stripePromoId,
        stripe_promo_code: stripePromoCode,
    });

    if (insertError) {
        await admin.auth.admin.deleteUser(authData.user.id);
        return { error: 'Could not add affiliate: ' + insertError.message };
    }

    revalidatePath('/admin/affiliates');
    return {};

}

/** Send an invite email with the sign-up link */
export async function sendAffiliateInvite(formData: FormData): Promise<{ error?: string }> {
    const admin = getAdminClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    // Check not already registered
    const { data: existing } = await admin.from('affiliates').select('id').eq('email', email).maybeSingle();
    if (existing) return { error: 'An affiliate with this email already exists.' };

    // For now, just send registration link — they sign up themselves via the portal
    // In future: could send a personalised invite email via Supabase / make.com
    // Simply return success — the caller shows the registration link to copy/share
    return {};
}
