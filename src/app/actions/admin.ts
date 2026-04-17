'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { dispatchEmail } from '@/lib/email';

// Update affiliate details — all editable fields
export async function updateAffiliate(id: string, formData: FormData) {
    const supabase = await createClient();

    const name               = formData.get('name') as string;
    const email              = formData.get('email') as string;
    const payout_email       = formData.get('payout_email') as string || null;
    const campaign_id        = formData.get('campaign_id') as string || null;
    const referral_code      = formData.get('referral_code') as string || null;
    const stripe_promo_code  = formData.get('stripe_promo_code') as string || null;
    const stripe_promo_id    = formData.get('stripe_promo_id') as string || null;
    const notes              = formData.get('notes') as string || null;

    const { error } = await supabase
        .from('affiliates')
        .update({ name, email, payout_email, campaign_id, referral_code, stripe_promo_code, stripe_promo_id, notes })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/affiliates');
    revalidatePath('/admin/referred-users');
    return { success: true };
}

// Fetch Stripe promotion codes using the connected Stripe key in settings
export async function getStripePromoCodes() {
    const supabase = await createClient();
    const { data: org } = await supabase.from('organizations').select('stripe_secret_key').limit(1).single();
    
    const secretKey = org?.stripe_secret_key || process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) return { success: false, error: 'Stripe is not connected in Settings.', codes: [] };

    try {
        const res = await fetch('https://api.stripe.com/v1/promotion_codes?limit=100&active=true', {
            headers: { 'Authorization': `Bearer ${secretKey}` },
            cache: 'no-store',
        });
        if (!res.ok) {
            const err = await res.json();
            return { success: false, error: err.error?.message || 'Stripe API error', codes: [] };
        }
        const data = await res.json();
        const codes = (data.data || []).map((p: any) => ({
            id: p.id,
            code: p.code,
            coupon_name: p.coupon?.name || p.coupon?.id || '—',
            percent_off: p.coupon?.percent_off || null,
            amount_off: p.coupon?.amount_off || null,
        }));
        return { success: true, codes };
    } catch (e: any) {
        return { success: false, error: e.message, codes: [] };
    }
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

// Update commission amount
export async function updateCommissionAmount(id: string, amount: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('commissions')
        .update({ amount })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    // Revalidate all pages that derive totals from commissions
    revalidatePath('/admin/commissions');
    revalidatePath('/admin/referred-users');
    revalidatePath('/admin/payouts/generate');
    revalidatePath('/admin');
    return { success: true };
}

// Delete a commission entirely
export async function deleteCommission(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/commissions');
    revalidatePath('/admin/referred-users');
    revalidatePath('/admin/payouts/generate');
    revalidatePath('/admin');
    return { success: true };
}

// Approve a pending affiliate → set status to active
export async function approvePendingAffiliate(id: string) {
    const supabase = await createClient();

    // Fetch the affiliate to get their email and org_id
    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('name, email, org_id, notify_account_approved')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('affiliates')
        .update({ status: 'active' })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    // Fire Approval Email securely over the tenant's exact configuration
    if (affiliate && affiliate.notify_account_approved !== false && affiliate.email) {
        // Compute direct login link
        const { data: org } = await supabase.from('organizations').select('custom_domain').eq('id', affiliate.org_id).single();
        const rawDomain = org?.custom_domain ? `https://${org.custom_domain}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliatemango.com');
        
        await dispatchEmail(affiliate.org_id, {
            to: affiliate.email,
            subject: "Your Partner Application is Approved!",
            html: `
                <h2 style="color: #333333; margin-top: 0; text-align: center;">Welcome to the Partner Program!</h2>
                <p style="color: #555555; font-size: 16px; margin-bottom: 20px; line-height: 1.5; text-align: center;">
                    Hi ${affiliate.name},<br><br>
                    Great news! Your partner application has been officially <strong>approved</strong>. We are thrilled to welcome you to the team.
                </p>
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${rawDomain}/login" style="background-color: #f97316; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Access Partner Portal</a>
                </div>
                <p style="color: #555555; font-size: 14px; text-align: center;">
                    Log in today to grab your unique tracking link and start viewing your commissions.
                </p>
            `,
        });
    }

    revalidatePath('/admin/affiliates');
    return { success: true };
}

// Deny a pending affiliate (delete the record so they can re-apply)
export async function denyPendingAffiliate(id: string, ban: boolean = false) {
    const supabase = await createClient();

    if (ban) {
        // Ban: keep the record but set status to banned so email is blocked
        const { error } = await supabase
            .from('affiliates')
            .update({ status: 'banned' })
            .eq('id', id);
        if (error) return { success: false, error: error.message };
    } else {
        // Deny + allow re-apply: delete the record entirely
        const { error } = await supabase
            .from('affiliates')
            .delete()
            .eq('id', id);
        if (error) return { success: false, error: error.message };
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
    const { error: payoutError, data: payoutData } = await supabase
        .from('payouts')
        .insert({
            id: crypto.randomUUID(),
            affiliate_id: affiliateId,
            org_id: affiliate.org_id,
            amount: amount,
            currency: 'USD',
            period: new Date().toISOString(),
            notes: notes || 'Manual payout'
        });

    if (payoutError) {
        console.error('Error creating payout record:', payoutError);
        const fs = require('fs');
        fs.writeFileSync('/tmp/payout_error.json', JSON.stringify(payoutError, null, 2));
        return { success: false, error: payoutError.message };
    } else {
        const fs = require('fs');
        fs.writeFileSync('/tmp/payout_success.json', JSON.stringify({ success: true, data: payoutData }, null, 2));
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

// Add a manual commission
export async function createManualCommission(formData: FormData) {
    const supabase = await createClient();

    const affiliate_id   = formData.get('affiliate_id') as string;
    const amount         = Number(formData.get('amount') as string);
    const customer_email = (formData.get('customer_email') as string)?.trim();
    const status         = formData.get('status') as string || 'pending';

    if (!affiliate_id || !amount) {
        return { success: false, error: 'Affiliate and amount are required' };
    }

    if (!customer_email) {
        return { success: false, error: 'Customer email is required' };
    }

    // Get org_id and campaign_id from the affiliate
    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('org_id, campaign_id, total_commission')
        .eq('id', affiliate_id)
        .single();
        
    if (!affiliate) return { success: false, error: 'Affiliate not found' };

    // 1. Lookup a referral row so it appears in the Referrals table if it exists
    let referralId: string;
    const { data: existingRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('customer_email', customer_email)
        .eq('affiliate_id', affiliate_id)
        .limit(1)
        .single();
        
    if (existingRef) {
        referralId = existingRef.id;
    } else {
        const { data: referral, error: referralError } = await supabase
            .from('referrals')
            .insert({
                org_id: affiliate.org_id,
                affiliate_id,
                customer_email,
                status: 'pending',
            })
            .select('id')
            .single();

        if (referralError) {
            console.error('Error creating referral for manual commission:', referralError);
            return { success: false, error: referralError.message };
        }
        referralId = referral.id;
    }

    // 2. Insert the commission, linked to the referral
    const { error: commError } = await supabase
        .from('commissions')
        .insert({
            org_id: affiliate.org_id,
            affiliate_id,
            referral_id: referralId,
            amount,
            commission_amount: amount,
            revenue: amount / 0.3,
            customer_email,
            status,
        });

    if (commError) {
        console.error('Error adding manual commission:', commError);
        return { success: false, error: commError.message };
    }

    // 3. Update affiliate total_commission balance
    await supabase
        .from('affiliates')
        .update({ total_commission: Number(affiliate.total_commission || 0) + amount })
        .eq('id', affiliate_id);

    revalidatePath('/admin/commissions');
    revalidatePath('/admin/referrals');
    revalidatePath('/admin/affiliates');
    revalidatePath('/admin');
    return { success: true };
}


export async function updateReferralStatus(id: string, status: 'pending' | 'paid') {
    const supabase = await createClient();
    const { error: rError } = await supabase.from('referrals').update({ status }).eq('id', id);
    if (!rError) {
        await supabase.from('commissions').update({ status }).eq('referral_id', id);
    }
    revalidatePath('/admin/referrals');
    return { success: !rError, error: rError?.message };
}

export async function deleteReferral(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('referrals').delete().eq('id', id);
    revalidatePath('/admin/referrals');
    return { success: !error, error: error?.message };
}
