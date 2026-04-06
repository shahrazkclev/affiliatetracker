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
