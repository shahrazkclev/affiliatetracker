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
    const campaignIds = formData.getAll('campaign_id') as string[];
    const stripePromoId = (formData.get('stripe_promo_id') as string)?.trim() || null;
    const stripePromoCode = (formData.get('stripe_promo_code') as string)?.trim() || null;

    if (!name || !email || !referralCode) return { error: 'Name, email, and referral code are required.' };

    // Resolve which campaigns to add to
    let resolvedCampaigns: { id: string, orgId: string, name: string }[] = [];
    
    if (campaignIds.length > 0) {
        const { data: camps } = await admin.from('campaigns').select('id, org_id, name').in('id', campaignIds);
        resolvedCampaigns = (camps || []).map(c => ({ id: c.id, orgId: c.org_id, name: c.name }));
    } else {
        const { data: defCamp } = await admin.from('campaigns').select('id, org_id, name').eq('is_default', true).maybeSingle();
        if (defCamp) resolvedCampaigns = [{ id: defCamp.id, orgId: defCamp.org_id, name: defCamp.name }];
    }

    if (resolvedCampaigns.length === 0) return { error: 'No valid campaigns found or specified.' };

    const firstOrgId = resolvedCampaigns[0].orgId;

    // Ensure base referral code isn't taken anywhere
    const { data: taken } = await admin
        .from('affiliates').select('id').eq('referral_code', referralCode).maybeSingle();
    if (taken) return { error: 'That primary referral code is already taken.' };

    let userId: string | null = null;
    let fallbackToEmail = false;

    // 1. Resolve or Create Supabase Auth User
    const { data: existingProfiles } = await admin
        .from('affiliates')
        .select('user_id')
        .eq('email', email)
        .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
        userId = existingProfiles[0].user_id;
    } else {
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
        });
        if (authError || !authData.user) {
            const { data: existingAuth } = await admin.auth.admin.listUsers();
            const matchedUser = existingAuth?.users.find((u: any) => u.email === email);
            if (matchedUser) {
                userId = matchedUser.id;
            } else {
                fallbackToEmail = true; // Not ideal, but won't crash if Auth setup has issues
            }
        } else {
            userId = authData.user.id;
        }
    }

    if (!userId && !fallbackToEmail) return { error: 'Failed to resolve user account.' };

    // 2. Build rows to insert
    const insertRows = [];
    for (let i = 0; i < resolvedCampaigns.length; i++) {
        const camp = resolvedCampaigns[i];
        
        // Generate referral code: first gets exact code, rest get suffixed versions
        let specificRefCode = referralCode;
        if (i > 0) {
            // e.g., 'john20-summer'
            const sanitizedCampName = camp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            specificRefCode = `${referralCode}-${sanitizedCampName || i}`;
        }
        
        // Avoid inserting if they are already in this specific campaign
        if (userId) {
            const { data: sameCampaign } = await admin
                .from('affiliates')
                .select('id')
                .eq('user_id', userId)
                .eq('campaign_id', camp.id)
                .maybeSingle();

            if (sameCampaign) continue; // Skip already assigned ones
        }

        insertRows.push({
            user_id: userId,
            org_id: camp.orgId,
            campaign_id: camp.id,
            name,
            email,
            referral_code: specificRefCode,
            status: 'active',
            stripe_promo_id: stripePromoId,
            stripe_promo_code: stripePromoCode,
        });
    }

    if (insertRows.length === 0) {
        return { error: 'User is already assigned to all selected campaigns.' };
    }

    // 3. Batch insert
    const { error: insertError } = await admin.from('affiliates').insert(insertRows);

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
