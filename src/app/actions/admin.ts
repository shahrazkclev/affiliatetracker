'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Update affiliate details (name, email, campaign)
export async function updateAffiliate(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const campaign_id = formData.get('campaign_id') as string;

    const { error } = await supabase
        .from('affiliates')
        .update({ name, email, campaign_id })
        .eq('id', id);

    if (error) {
        console.error('Error updating affiliate:', error);
        return { success: false, error: error.message };
    }

    // Need to also update the auth email if we were modifying auth users, but here we just update the affiliate record email.
    // If they log in via Supabase Auth, they still use their original email unless we use admin auth api to change it.

    revalidatePath('/admin/affiliates');
    return { success: true };
}

// Ban affiliate
export async function banAffiliate(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('affiliates')
        .update({ status: 'banned' })
        .eq('id', id);

    if (error) {
        console.error('Error banning affiliate:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/affiliates');
    return { success: true };
}

// Unban / Activate affiliate
export async function activateAffiliate(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('affiliates')
        .update({ status: 'active' })
        .eq('id', id);

    if (error) {
        console.error('Error activating affiliate:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/affiliates');
    return { success: true };
}

// Mark payout as paid
export async function markPayoutAsPaid(affiliateId: string, amount: number, notes?: string) {
    const supabase = await createClient();

    // 1. Fetch affiliate to get org_id
    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('org_id')
        .eq('id', affiliateId)
        .single();

    if (!affiliate) return { success: false, error: 'Affiliate not found' };

    // 2. Create payout record
    const { error: payoutError } = await supabase
        .from('payouts')
        .insert({
            affiliate_id: affiliateId,
            org_id: affiliate.org_id,
            amount: amount,
            status: 'paid',
            notes: notes || 'Manual payout'
        });

    if (payoutError) {
        console.error('Error creating payout record:', payoutError);
        return { success: false, error: payoutError.message };
    }

    // 3. Reset total_commission to 0 for this affiliate
    const { error: resetError } = await supabase
        .from('affiliates')
        .update({ total_commission: 0 })
        .eq('id', affiliateId);

    if (resetError) {
        console.error('Error resetting commission:', resetError);
        return { success: false, error: resetError.message };
    }

    revalidatePath('/admin/payouts/generate');
    revalidatePath('/admin/payouts/history');
    return { success: true };
}

// Delay payout
export async function delayPayout(affiliateId: string) {
    // Currently just a stub, could add a "payout_status" or "hold" column to affiliate
    console.log(`Delaying payout for ${affiliateId}`);
    return { success: true, message: "Payout delayed (Feature placeholder)" };
}

// Update Commission Status (Individual row)
export async function updateCommissionStatus(commissionId: string, status: 'paid' | 'void') {
    const supabase = await createClient();

    // 1. Fetch exact commission amount and affiliate ID
    const { data: commission } = await supabase
        .from('commissions')
        .select('amount, affiliate_id, status')
        .eq('id', commissionId)
        .single();

    if (!commission) return { success: false, error: 'Commission not found' };

    // Prevent double processing
    if (commission.status === status) return { success: true };

    // 2. Update commission status
    const { error: commError } = await supabase
        .from('commissions')
        .update({ status })
        .eq('id', commissionId);

    if (commError) {
        console.error('Error updating commission row:', commError);
        return { success: false, error: commError.message };
    }

    // 3. If voiding, we should logically deduct this amount from their total_commission balance 
    //    so they aren't paid out for voided refs. (If we mark 'paid' individually, we might also deduct it from the *pending* balance).
    if (status === 'void' && commission.status !== 'void') {
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('total_commission')
            .eq('id', commission.affiliate_id)
            .single();

        if (affiliate) {
            const newTotal = Math.max(0, Number(affiliate.total_commission) - Number(commission.amount));
            await supabase
                .from('affiliates')
                .update({ total_commission: newTotal })
                .eq('id', commission.affiliate_id);
        }
    }

    revalidatePath('/admin/commissions');
    return { success: true };
}
