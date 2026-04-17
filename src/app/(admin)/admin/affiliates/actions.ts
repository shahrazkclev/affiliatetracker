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

    // Get org_id from campaign, or from default campaign
    let orgId: string | null = null;
    if (campaignId) {
        const { data: camp } = await admin.from('campaigns').select('org_id').eq('id', campaignId).maybeSingle();
        orgId = camp?.org_id ?? null;
    } else {
        const { data: defCamp } = await admin.from('campaigns').select('id, org_id').eq('is_default', true).maybeSingle();
        orgId = defCamp?.org_id ?? null;
    }

    if (!name || !email || !referralCode) return { error: 'Name, email, and referral code are required.' };

    // Check referral code not already taken across the entire system
    const { data: taken } = await admin
        .from('affiliates').select('id').eq('referral_code', referralCode).maybeSingle();
    if (taken) return { error: 'That referral code is already taken.' };

    let userId: string | null = null;

    // Check if they have an existing profile
    const { data: existingProfiles } = await admin
        .from('affiliates')
        .select('user_id')
        .eq('email', email)
        .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
        userId = existingProfiles[0].user_id;

        // Ensure they aren't already mapped to THIS specific campaign
        const { data: sameCampaign } = await admin
            .from('affiliates')
            .select('id')
            .eq('email', email)
            .eq('org_id', orgId)
            .eq('campaign_id', campaignId || null)
            .maybeSingle();

        if (sameCampaign) {
            return { error: 'This partner is already assigned to this campaign.' };
        }
    } else {
        // Create auth user (no password — they'll set it on first login via magic link)
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
        });
        if (authError || !authData.user) {
            // Fallback in case they existed in Auth but not Affiliates
            const { data: existingAuth } = await admin.auth.admin.listUsers();
            const matchedUser = existingAuth?.users.find((u: any) => u.email === email);
            if (matchedUser) {
                userId = matchedUser.id;
            } else {
                return { error: authError?.message || 'Could not create account.' };
            }
        } else {
            userId = authData.user.id;
        }
    }

    const { error: insertError } = await admin.from('affiliates').insert({
        user_id: userId,
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
