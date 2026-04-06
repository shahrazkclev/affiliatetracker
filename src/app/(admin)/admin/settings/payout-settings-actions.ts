'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function savePayoutNotificationEmail(email: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('organizations')
        .update({ payout_notification_email: email || null })
        .not('id', 'is', null); // update all rows (single-tenant)

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}
