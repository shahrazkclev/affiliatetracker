'use server';

import { redirect } from 'next/navigation';
import { createClient, getResolvedOrgId } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { buildAuthCallbackUrl, getPortalSiteUrl } from '@/lib/auth-urls';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/** Check if the user has clicked the confirmation link in their email */
export async function checkEmailConfirmed(email: string): Promise<{ confirmed: boolean; error?: string }> {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc('check_email_confirmed', { user_email: email });
    if (error) return { confirmed: false, error: 'Could not check status.' };
    return { confirmed: !!data };
}

/** Step 1 of sign-up: send confirmation link email before showing the application form */
export async function sendSignupConfirmation(formData: FormData): Promise<{ error?: string; existingUser?: boolean }> {
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
        return { existingUser: true };
    }

    let orgIdStr = (formData.get('org_id') as string)?.trim();
    if (!orgIdStr) {
        const resolved = await getResolvedOrgId();
        if (resolved) orgIdStr = resolved;
    }

    const portalUrl = await getPortalSiteUrl();

    // Ensure user exists in auth.users without triggering Supabase default signup email
    await admin.auth.admin.createUser({
        email,
        email_confirm: true,
    }).catch(() => {});

    let appUrl = portalUrl;
    let logoUrl, logoHeight;

    if (orgIdStr) {
        const { data: orgData } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgIdStr).maybeSingle();
        if (orgData?.custom_domain) {
            appUrl = `https://${orgData.custom_domain}`;
        }
        logoUrl = orgData?.logo_url;
        logoHeight = orgData?.logo_email_height;
    }

    const nextPath = orgIdStr ? `/apply/details?org_id=${orgIdStr}` : '/apply/details';
    const redirectTo = buildAuthCallbackUrl(appUrl, nextPath);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
    });

    if (linkErr) {
        return { error: linkErr.message };
    }

    if (linkData?.properties?.action_link) {
        const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
        const { dispatchEmail } = await import('@/lib/email');

        const htmlContent = AUTH_LINK_TEMPLATE(
            'Confirm Your Application',
            `Thank you for applying to join our affiliate program! Click the button below to verify your email address (${email}) and complete your application.`,
            'Confirm Application & Verify Email',
            linkData.properties.action_link,
            appUrl,
            logoUrl,
            logoHeight
        );

        await dispatchEmail(orgIdStr || null, {
            to: email,
            subject: 'Confirm your affiliate application',
            html: htmlContent,
            _rawHtmlOverride: true,
        } as any);
    }

    return {};
}

/** Complete single-step affiliate application submit */
export async function submitFullApplication(formData: FormData): Promise<{ error?: string; existingUser?: boolean }> {
    const supabase = await createClient();
    const admin = getAdminClient();

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const name = (formData.get('name') as string)?.trim();
    const referralCode = (formData.get('referralCode') as string)?.trim().toLowerCase().replace(/\s+/g, '');
    let orgId = (formData.get('org_id') as string)?.trim();

    if (!email || !name || !referralCode) return { error: 'All fields are required.' };

    if (!orgId) {
        const resolved = await getResolvedOrgId();
        if (resolved) orgId = resolved;
    }

    if (!orgId) return { error: 'Organization context is missing. Please use a valid application link.' };

    // Check if already registered as an affiliate
    const { data: existingAffiliate } = await admin
        .from('affiliates')
        .select('id, status')
        .eq('email', email)
        .maybeSingle();

    if (existingAffiliate) {
        return { existingUser: true };
    }

    // Check referral code uniqueness for this org
    const { data: taken } = await admin
        .from('affiliates')
        .select('id')
        .eq('org_id', orgId)
        .eq('referral_code', referralCode)
        .maybeSingle();

    if (taken) return { error: 'That referral code is taken. Please choose another.' };

    // Enforce SaaS Tier Affiliate Limits
    const { data: orgInfo } = await admin
        .from('organizations')
        .select('saas_plans(max_affiliates)')
        .eq('id', orgId)
        .single();
    
    const maxAffiliates = (orgInfo?.saas_plans as any)?.max_affiliates;
    if (maxAffiliates !== null && maxAffiliates !== undefined) {
        const { count } = await admin.from('affiliates').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
        if ((count || 0) >= maxAffiliates) {
            return { error: 'This organization is currently not accepting new affiliates.' };
        }
    }

    const { data: campaign } = await admin
        .from('campaigns')
        .select('id, org_id')
        .eq('org_id', orgId)
        .eq('is_default', true)
        .maybeSingle();

    // Insert pending affiliate application
    const { error: insertError } = await admin.from('affiliates').insert({
        user_id: null,
        org_id: orgId,
        campaign_id: campaign?.id ?? null,
        name,
        email,
        referral_code: referralCode,
        status: 'pending',
    });

    if (insertError) {
        console.error('[submitFullApplication]', insertError);
        return { error: 'Failed to create application: ' + insertError.message };
    }

    // Ensure user exists in auth.users without triggering Supabase default signup email
    await admin.auth.admin.createUser({
        email,
        email_confirm: true,
    }).catch(() => {});

    // Send confirmation link using custom branded HTML email
    const portalUrl = await getPortalSiteUrl();
    let appUrl = portalUrl;
    let logoUrl, logoHeight;

    const { data: orgData } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgId).maybeSingle();
    if (orgData?.custom_domain) {
        appUrl = `https://${orgData.custom_domain}`;
    }
    logoUrl = orgData?.logo_url;
    logoHeight = orgData?.logo_email_height;

    const redirectTo = buildAuthCallbackUrl(appUrl, '/applied');

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
    });

    if (linkErr) {
        console.error('[submitFullApplication] generateLink error:', linkErr.message);
        return { error: 'Failed to generate confirmation link: ' + linkErr.message };
    }

    if (linkData?.properties?.action_link) {
        const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
        const { dispatchEmail } = await import('@/lib/email');

        const htmlContent = AUTH_LINK_TEMPLATE(
            'Confirm Your Application',
            `Thank you for applying to join our affiliate program! Click the button below to verify your email address (${email}) and complete your application.`,
            'Confirm Application & Verify Email',
            linkData.properties.action_link,
            appUrl,
            logoUrl,
            logoHeight
        );

        await dispatchEmail(orgId, {
            to: email,
            subject: 'Confirm your affiliate application',
            html: htmlContent,
            _rawHtmlOverride: true,
        } as any);
    }

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
    let orgId = (formData.get('org_id') as string)?.trim();

    if (!orgId) {
        const resolved = await getResolvedOrgId();
        if (resolved) orgId = resolved;
    }

    if (!name || !referralCode) return { error: 'All fields are required.' };
    if (!orgId) return { error: 'Organization context is missing. Please use a valid application link.' };

    // Prevent duplicate crash if user is already an affiliate
    const { data: alreadyAffiliate } = await admin
        .from('affiliates')
        .select('id')
        .eq('email', user.email)
        .eq('org_id', orgId)
        .maybeSingle();

    if (alreadyAffiliate) {
        redirect('/portal');
        return {};
    }

    // Check referral code uniqueness across the specific org or globally?
    // Referral codes are usually global or per-org. Let's do per-org.
    const { data: taken } = await admin
        .from('affiliates')
        .select('id')
        .eq('org_id', orgId)
        .eq('referral_code', referralCode)
        .maybeSingle();

    if (taken) return { error: 'That referral code is taken. Please choose another.' };

    // --- ENFORCE SAAS TIER AFFILIATE LIMITS ---
    const { data: orgInfo } = await admin
        .from('organizations')
        .select('saas_plans(max_affiliates)')
        .eq('id', orgId)
        .single();
    
    const maxAffiliates = (orgInfo?.saas_plans as any)?.max_affiliates;
    if (maxAffiliates !== null && maxAffiliates !== undefined) {
        const { count } = await admin.from('affiliates').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
        if ((count || 0) >= maxAffiliates) {
            return { error: 'This organization is currently not accepting new affiliates.' };
        }
    }
    // ------------------------------------------

    const { data: campaign } = await admin
        .from('campaigns')
        .select('id, org_id')
        .eq('org_id', orgId)
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
