'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateNotificationPreferences(affiliateId: string, preferences: Record<string, boolean>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('affiliates')
        .update({
            notify_new_referral: preferences.new_referral,
            notify_new_commission: preferences.new_commission,
            notify_payout_generated: preferences.payout_generated,
            notify_account_approved: preferences.account_approved,
            notify_account_revision: preferences.account_revision,
        })
        .eq('id', affiliateId);

    if (error) {
        console.error('Error updating notification preferences:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/portal/settings');
    return { success: true };
}

export async function updateProfile(affiliateId: string, data: { firstName: string; lastName: string; email: string }) {
    const supabase = await createClient();
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    // 1. Update the affiliate profile in affiliates table
    const { error: profileError } = await supabase
        .from('affiliates')
        .update({
            name: fullName,
            email: data.email
        })
        .eq('id', affiliateId);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        return { success: false, error: profileError.message };
    }

    // 2. Update auth email if it changed
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email !== data.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: data.email });
        if (authError) {
            console.error('Error updating auth email:', authError);
            return { success: false, error: `Profile updated, but failed to update login email: ${authError.message}` };
        }
        return { success: true, emailChanged: true };
    }

    revalidatePath('/portal/settings');
    return { success: true };
}

export async function updatePayoutSettings(affiliateId: string, data: { paypalEmail: string; wiseEmail: string }) {
    const supabase = await createClient();

    // Update both paypal_email and wise_email, and sync payout_email as a fallback
    const { error } = await supabase
        .from('affiliates')
        .update({
            paypal_email: data.paypalEmail || null,
            wise_email: data.wiseEmail || null,
            payout_email: data.paypalEmail || data.wiseEmail || null
        })
        .eq('id', affiliateId);

    if (error) {
        console.error('Error updating payout settings:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/portal/settings');
    return { success: true };
}

