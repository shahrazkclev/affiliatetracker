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
    const admin = getAdminClient();
    const supabase = await createClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required.' };

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 0. Admin bypass — if this email is an organization owner, skip affiliate check
    const { data: authUser } = await admin.auth.admin.listUsers();
    const matchedUser = (authUser?.users || []).find(u => u.email?.toLowerCase() === email);
    if (matchedUser) {
        const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('owner_id', matchedUser.id)
            .maybeSingle();
        if (org) return { hasPassword: true };
    }

    // 1. Check affiliates table
    const { data: affiliate, error: affErr } = await admin
        .from('affiliates')
        .select('id, user_id')
        .eq('email', email)
        .maybeSingle();

    if (affErr) return { error: 'Could not verify your account. Please try again.' };
    if (!affiliate) return { notAffiliate: true };

    // 2. No auth user yet — create one and send password setup email
    if (!affiliate.user_id) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
        });
        if (createErr) return { error: 'Could not set up your account. Please contact support.' };

        // Link to affiliate row
        await admin.from('affiliates').update({ user_id: created.user.id }).eq('id', affiliate.id);

        // Send password reset/setup email
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
        });

        return { setupEmailSent: true };
    }

    // 3. Auth user exists — check if they have a password
    const { data: pwCheck } = await admin.rpc('check_user_has_password', { user_email: email });
    const hasPassword = pwCheck?.[0]?.has_password ?? false;
    return { hasPassword };
}


/** Send magic link for first-time login (no password set yet) */
export async function sendMagicLink(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false,
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) return { error: error.message };
    return {};
}

/** Standard password login for returning users */
export async function loginWithPassword(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Incorrect password. Please try again.' };

    // Check if this user owns an organization → send to admin panel
    const userId = signInData.user?.id;
    if (userId) {
        const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('owner_id', userId)
            .maybeSingle();
        if (org) {
            revalidatePath('/', 'layout');
            redirect('/admin');
        }
    }

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

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });

    // Always return success to prevent email enumeration
    if (error) console.error('[sendPasswordReset]', error.message);
    return {};
}

