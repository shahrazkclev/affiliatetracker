"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createManualReferral(data: {
    affiliate_id: string;
    customer_email: string;
    revenue?: number;
    commission?: number;
    isPercentage?: boolean;
}) {
    const supabase = await createClient();

    // 1. Get affiliate info to get the org_id and commission rate via campaigns
    const { data: affiliate, error: affErr } = await supabase
        .from('affiliates')
        .select(`
            org_id,
            campaigns ( default_commission_percent )
        `)
        .eq('id', data.affiliate_id)
        .single();

    if (affErr || !affiliate) {
        console.error('Affiliate fetch error:', affErr);
        return { success: false, error: "Affiliate not found or database error." };
    }

    const commissionRate = (affiliate as any).campaigns?.default_commission_percent || 0;

    try {
        // 2. Lookup existing Referral
        let referralId: string;
        const { data: existingRef } = await supabase
            .from('referrals')
            .select('id')
            .eq('customer_email', data.customer_email)
            .eq('affiliate_id', data.affiliate_id)
            .limit(1)
            .single();

        if (existingRef) {
            referralId = existingRef.id;
        } else {
            // Insert new Referral matching Stripe default status 'pending'
            const { data: referral, error: referralError } = await supabase
                .from('referrals')
                .insert({
                    affiliate_id: data.affiliate_id,
                    org_id: affiliate.org_id,
                    customer_email: data.customer_email,
                    status: 'pending' // Stripe inserts pending until actually paid
                })
                .select('id')
                .single();

            if (referralError) {
                console.error('Error creating referral:', referralError);
                return { success: false, error: referralError.message };
            }
            referralId = referral.id;
        }

        // 3. Insert Commission if applicable
        const hasRevenue = typeof data.revenue === 'number';
        const hasCommissionInput = typeof data.commission === 'number';

        if (hasRevenue || hasCommissionInput) {
            let amount = 0;
            if (hasCommissionInput) {
                amount = data.isPercentage && data.revenue ? (data.revenue * (data.commission! / 100)) : data.commission!;
            } else if (hasRevenue) {
                amount = data.revenue! * (commissionRate / 100);
            }

            const mockStripeChargeId = `manual_charge_${crypto.randomUUID()}`;

            const { error: commissionError } = await supabase
                .from('commissions')
                .insert({
                    affiliate_id: data.affiliate_id,
                    org_id: affiliate.org_id,
                    referral_id: referralId,
                    stripe_charge_id: mockStripeChargeId,
                    customer_email: data.customer_email,
                    revenue: data.revenue || 0,
                    commission_amount: amount,
                    amount: amount, // Vital missing link
                    status: 'pending' // Pending payout
                });

            if (commissionError) {
                console.error('Error creating manual commission:', commissionError);
                return { success: false, error: `Referral created but commission failed: ${commissionError.message}` };
            }

            // 4. Update the affiliate's total_commission field
            const { data: currentAff } = await supabase
                .from('affiliates')
                .select('total_commission')
                .eq('id', data.affiliate_id)
                .single();
                
            await supabase.from('affiliates').update({
                total_commission: (currentAff?.total_commission || 0) + amount
            }).eq('id', data.affiliate_id);
        }

        revalidatePath('/admin/referrals');
        revalidatePath('/admin/payouts', 'layout');

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
