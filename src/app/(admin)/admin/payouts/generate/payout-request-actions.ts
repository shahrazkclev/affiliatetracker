'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function dismissPayoutRequest(requestId: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('payout_requests')
            .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
            .eq('id', requestId);
        if (error) return { success: false, error: error.message };
        revalidatePath('/admin/payouts/generate');
        return { success: true };
    } catch (err: any) {
        console.error('[dismissPayoutRequest] Critical exception:', err);
        return { success: false, error: err.message || 'Server error occurred' };
    }
}

export async function resolvePayoutRequest(requestId: string) {
    try {
        const supabase = await createClient();
        
        // 1. Fetch the request details to construct the actual payout record
        const { data: request, error: fetchErr } = await supabase
            .from('payout_requests')
            .select('org_id, affiliate_id, amount')
            .eq('id', requestId)
            .single();
            
        if (fetchErr || !request) {
            return { success: false, error: fetchErr?.message || 'Payout request not found.' };
        }

        // 2. Formally log the payout to deduct affiliate balances
        const { error: insertErr } = await supabase
            .from('payouts')
            .insert({
                org_id: request.org_id,
                affiliate_id: request.affiliate_id,
                amount: request.amount,
                status: 'paid', // Standard payout status
            });

        if (insertErr) {
            console.error('[resolvePayoutRequest] Error inserting payout:', insertErr);
            return { success: false, error: insertErr.message };
        }

        // 3. Mark the request as paid
        const { error: updateErr } = await supabase
            .from('payout_requests')
            .update({ status: 'paid', resolved_at: new Date().toISOString() })
            .eq('id', requestId);
            
        if (updateErr) {
            console.error('[resolvePayoutRequest] Error updating request:', updateErr);
            return { success: false, error: updateErr.message };
        }

        revalidatePath('/admin/payouts/generate');
        return { success: true };
    } catch (err: any) {
        console.error('[resolvePayoutRequest] Critical exception:', err);
        return { success: false, error: err.message || 'Server error occurred' };
    }
}
