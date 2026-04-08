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
        .select('id, user_id')
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

        // Send password setup email
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
        });

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

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false,
            emailRedirectTo: `${SITE_URL}/auth/callback`,
        },
    });

    if (error) return { error: error.message };
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

    // Check if this user owns an organization → send to admin panel
    const userId = signInData.user?.id;
    if (userId) {
        const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('owner_id', userId)
            .maybeSingle();
        if (org) {
            console.log('[loginWithPassword] User is an admin owner of org:', org.id, 'redirecting -> /admin');
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });

    // Always return success to prevent email enumeration
    if (error) console.error('[sendPasswordReset]', error.message);
    return {};
}

