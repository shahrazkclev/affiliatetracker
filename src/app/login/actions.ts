'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Unified login check:
 * 1. Not in affiliates → notAffiliate
 * 2. In affiliates, no auth user → create user + send password-setup email → setupEmailSent
 * 3. In affiliates, auth user, no password → hasPassword: false
 * 4. In affiliates, auth user, has password → hasPassword: true
 */
export async function checkLoginStatus(formData: FormData): Promise<{
    hasPassword?: boolean;
    setupEmailSent?: boolean;
    notAffiliate?: boolean;
    error?: string;
}> {
    console.log('[checkLoginStatus] Invoked checkLoginStatus');
    const admin = getAdminClient();
    const supabase = await createClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    const siteHost = (await import('next/headers')).headers().then(h => h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "partners.affiliatemango.com");
    const isLocal = (await siteHost).includes('localhost');
    const SITE_URL = isLocal ? `http://${await siteHost}` : `https://${await siteHost}`;

    // 1. Check if they have an auth user already via the existing RPC
    const { data: pwCheck } = await admin.rpc('check_user_has_password', { user_email: email });
    const userExists = pwCheck && pwCheck.length > 0;
    const hasPassword = pwCheck?.[0]?.has_password ?? false;

    // 2. Check if they are an affiliate
    const { data: affiliate, error: affErr } = await admin
        .from('affiliates')
        .select('id, user_id, org_id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

    if (affErr) {
        console.error('[checkLoginStatus] Affiliate lookup error:', affErr);
        return { error: 'Could not verify your account. Please try again.' };
    }

    if (!affiliate) {
        console.log('[checkLoginStatus] Email not found in affiliates table');
        // If they are not an affiliate and they DO NOT exist in auth.users, they are completely unknown.
        if (!userExists) return { notAffiliate: true };
        
        // If they are not an affiliate but DO exist in auth.users, they might be an Organization Owner.
        // Proceed to password step or magic link
        console.log('[checkLoginStatus] User exists in auth but not in affiliates table -> Organization Owner pass-through');
        return { hasPassword };
    }

    console.log('[checkLoginStatus] Affiliate found, userExists in Auth:', userExists, 'affiliate.user_id:', affiliate.user_id);

    // 3. No auth user yet for this affiliate — create one and send setup email
    if (!affiliate.user_id && !userExists) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
        });
        if (createErr) return { error: 'Could not set up your account. Please contact support.' };

        // Link to affiliate row
        await admin.from('affiliates').update({ user_id: created.user.id }).eq('id', affiliate.id);

        const orgId = affiliate?.org_id || await (await import('@/utils/supabase/server')).getResolvedOrgId();
        let appUrl = SITE_URL;
        let logoUrl, logoHeight;
        let orgInfo: { logo_url?: string; logo_email_height?: number; custom_domain?: string } | null = null;

        if (orgId) {
            const { data } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgId).maybeSingle();
            orgInfo = data;
            logoUrl = orgInfo?.logo_url;
            logoHeight = orgInfo?.logo_email_height;
            if (orgInfo?.custom_domain) {
                appUrl = `https://${orgInfo.custom_domain}`;
            }
        }

        // Send password setup email natively using generated link
        const returnParam = orgInfo?.custom_domain ? `&return_to=${orgInfo.custom_domain}` : '';
        const { data: linkData } = await admin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: `https://partners.affiliatemango.com/auth/callback?next=/reset-password` }
        });

        if (linkData?.properties?.action_link) {
            const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
            const { dispatchEmail } = await import('@/lib/email');
            
            const htmlContent = AUTH_LINK_TEMPLATE(
                'Setup your password',
                'Welcome! You have been granted access. Click the button below to set up your password and sign in.',
                'Set Password',
                linkData.properties.action_link,
                appUrl,
                logoUrl,
                logoHeight
            );
            await dispatchEmail(orgId, { to: email, subject: 'Setup your password', html: htmlContent, _rawHtmlOverride: true } as any);
        }

        return { setupEmailSent: true };
    }

    // 4. Affiliate exists and Auth user exists
    return { hasPassword };
}


/** Send magic link for first-time login (no password set yet) */
export async function sendMagicLink(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();

    const siteHost = (await import('next/headers')).headers().then(h => h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "partners.affiliatemango.com");
    const isLocal = (await siteHost).includes('localhost');
    const SITE_URL = isLocal ? `http://${await siteHost}` : `https://${await siteHost}`;

    const admin = getAdminClient();
    
    // Find custom domain from DB
    const orgId = await (await import('@/utils/supabase/server')).getResolvedOrgId();
    let appUrl = SITE_URL;
    let logoUrl, logoHeight;

    if (orgId) {
        const { data: orgInfo } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgId).maybeSingle();
        logoUrl = orgInfo?.logo_url;
        logoHeight = orgInfo?.logo_email_height;
        if (orgInfo?.custom_domain) {
            appUrl = `https://${orgInfo.custom_domain}`;
        }
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `https://partners.affiliatemango.com/auth/callback` }
    });

    if (linkErr) return { error: linkErr.message };

    if (linkData?.properties?.action_link) {
        const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
        const { dispatchEmail } = await import('@/lib/email');
        
        const htmlContent = AUTH_LINK_TEMPLATE(
            'Your Magic Link',
            'Click the button below to securely sign in to your dashboard.',
            'Sign In Instantly',
            linkData.properties.action_link,
            appUrl,
            logoUrl,
            logoHeight
        );
        await dispatchEmail(orgId, { to: email, subject: 'Your Magic Link', html: htmlContent, _rawHtmlOverride: true } as any);
    }

    return {};
}

/** Standard password login for returning users */
export async function loginWithPassword(formData: FormData): Promise<{ error?: string }> {
    console.log('[loginWithPassword] Attempting standard password login...');
    const supabase = await createClient();
    const admin = getAdminClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('[loginWithPassword] Incorrect password or sign in error:', error.message);
        return { error: 'Incorrect password. Please try again.' };
    }

    console.log('[loginWithPassword] Sign in success for user ID:', signInData.user?.id);

    // Check if this user is a team member of an organization → send to admin panel
    const userId = signInData.user?.id;
    if (userId) {
        const { data: teamMembership } = await admin
            .from('team_members')
            .select('org_id')
            .eq('user_id', userId)
            .maybeSingle();
            
        if (teamMembership?.org_id) {
            console.log('[loginWithPassword] User is an admin/team member of org:', teamMembership.org_id, 'redirecting -> /admin');
            revalidatePath('/', 'layout');
            redirect('/admin');
        }
    }

    console.log('[loginWithPassword] Route user to affiliate portal -> /portal');
    revalidatePath('/', 'layout');
    redirect('/portal');
}


/** Set password after magic link verified (called from set-password page) */
export async function setPassword(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) return { error: 'Passwords do not match.' };
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Session expired. Please sign in again.' };

    const { error } = await admin.auth.admin.updateUserById(user.id, { password });
    if (error) return { error: 'Could not set password: ' + error.message };

    revalidatePath('/', 'layout');
    redirect('/portal');
}

/** Send password reset email */
export async function sendPasswordReset(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    const siteHost = (await import('next/headers')).headers().then(h => h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "partners.affiliatemango.com");
    const isLocal = (await siteHost).includes('localhost');
    const SITE_URL = isLocal ? `http://${await siteHost}` : `https://${await siteHost}`;

    const admin = getAdminClient();
    const { data: affiliate } = await admin.from('affiliates').select('org_id').eq('email', email).maybeSingle();
    const orgId = affiliate?.org_id || await (await import('@/utils/supabase/server')).getResolvedOrgId();
    
    let appUrl = SITE_URL;
    let logoUrl, logoHeight;
    let orgInfo: { logo_url?: string; logo_email_height?: number; custom_domain?: string } | null = null;

    if (orgId) {
        const { data } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgId).maybeSingle();
        orgInfo = data;
        logoUrl = orgInfo?.logo_url;
        logoHeight = orgInfo?.logo_email_height;
        if (orgInfo?.custom_domain) {
            appUrl = `https://${orgInfo.custom_domain}`;
        }
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `https://partners.affiliatemango.com/auth/callback?next=/reset-password` }
    });

    if (linkErr) console.error('[sendPasswordReset] Generate Link Error:', linkErr.message);

    if (linkData?.properties?.action_link) {
        const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
        const { dispatchEmail } = await import('@/lib/email');
        
        const htmlContent = AUTH_LINK_TEMPLATE(
            'Reset Password',
            'Someone requested a password reset for your account. If this was you, click the button below to choose a new password.',
            'Reset Password',
            linkData.properties.action_link,
            appUrl,
            logoUrl,
            logoHeight
        );
        await dispatchEmail(orgId, { to: email, subject: 'Reset Your Password', html: htmlContent, _rawHtmlOverride: true } as any);
    }

    // Always return success to prevent email enumeration
    return {};
}

