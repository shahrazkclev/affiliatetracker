'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function dismissPayoutRequest(requestId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('payout_requests')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('id', requestId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/payouts/generate');
    return { success: true };
}

export async function resolvePayoutRequest(requestId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('payout_requests')
        .update({ status: 'paid', resolved_at: new Date().toISOString() })
        .eq('id', requestId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/payouts/generate');
    return { success: true };
}
