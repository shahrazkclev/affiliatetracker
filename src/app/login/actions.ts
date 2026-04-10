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


/**
 * OTP Login — generates a magic link, extracts the token, builds our OWN /auth/otp URL,
 * and sends it via org SMTP (or global SMTP fallback).
 * Completely bypasses Supabase redirect URL whitelist.
 */

/**
 * Sends a 6-digit OTP code via org SMTP (or global SMTP fallback).
 * Uses Supabase generateLink to get the email_otp code without sending any email itself.
 */
export async function sendOtpEmail(formData: FormData): Promise<{ error?: string; sent?: boolean }> {
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    const admin = getAdminClient();

    const siteHost = await (await import('next/headers')).headers().then(h =>
        h.get('x-mango-tenant-host') || h.get('x-forwarded-host') || h.get('host') || 'partners.affiliatemango.com'
    );
    const isLocal = siteHost.includes('localhost');
    const SITE_URL = isLocal ? `http://${siteHost}` : `https://${siteHost}`;

    const { getResolvedOrgId } = await import('@/utils/supabase/server');
    const orgId = await getResolvedOrgId();
    if (!orgId) return { error: 'Organization not found.' };

    const { data: affiliate } = await admin
        .from('affiliates')
        .select('id')
        .eq('email', email)
        .eq('org_id', orgId)
        .maybeSingle();

    // Silent success to prevent email enumeration
    if (!affiliate) return { sent: true };

    const { data: orgInfo } = await admin
        .from('organizations')
        .select('name, logo_url, logo_email_height, custom_domain')
        .eq('id', orgId)
        .maybeSingle();

    const appUrl = orgInfo?.custom_domain ? `https://${orgInfo.custom_domain}` : SITE_URL;

    // Generate — email_otp is the 6-digit code, we handle our own email sending
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: 'https://partners.affiliatemango.com/portal' },
    });

    if (linkErr || !linkData?.properties?.email_otp) {
        console.error('[sendOtpEmail] generateLink error:', linkErr?.message);
        return { error: 'Could not generate code. Please try again.' };
    }

    const otp = linkData.properties.email_otp;

    const { dispatchEmail } = await import('@/lib/email');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0e0e10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0e10;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            ${orgInfo?.logo_url ? `<img src="${orgInfo.logo_url}" alt="Logo" style="height:${orgInfo.logo_email_height || 40}px;margin-bottom:24px;" />` : ''}
            <h1 style="color:#f4f4f5;font-size:20px;font-weight:700;margin:0 0 8px;">Your sign-in code</h1>
            <p style="color:#71717a;font-size:14px;margin:0 0 32px;">Enter this code to sign in to your affiliate dashboard. It expires in 1 hour.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px;">
            <div style="background-color:#09090b;border:1px solid #3f3f46;border-radius:8px;padding:24px;text-align:center;">
              <span style="font-family:'Courier New',monospace;font-size:40px;font-weight:800;letter-spacing:12px;color:#f97316;">${otp}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;text-align:center;">
            <p style="color:#52525b;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await dispatchEmail(orgId, {
        to: email,
        subject: `${otp} — your sign-in code`,
        html,
        _rawHtmlOverride: true,
    } as any);

    return { sent: true };
}

/**
 * Verifies the 6-digit OTP code and creates a session.
 */
export async function verifyOtpCode(formData: FormData): Promise<{ error?: string }> {
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const code = (formData.get('code') as string)?.trim();

    if (!email || !code) return { error: 'Email and code are required.' };

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'magiclink',
    });

    if (error || !data.user) {
        return { error: 'Invalid or expired code. Please request a new one.' };
    }

    redirect('/portal');
}
