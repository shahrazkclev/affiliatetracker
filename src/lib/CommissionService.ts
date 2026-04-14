import { createClient } from '@supabase/supabase-js';

// We need an admin client for webhooks to bypass RLS since the webhook isn't authenticated as a user
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export type CommissionPayload = {
    orgId: string;
    integrationSource: 'stripe' | 'lemonsqueezy' | 'paddle' | 'paypal' | 'custom';
    customerEmail: string;
    revenue: number;
    referralCode?: string | null;
    externalCustomerId?: string | null;
    externalChargeId?: string | null;
};

export class CommissionService {
    /**
     * Processes a conversion event from any supported payment integration,
     * routes the commission to the correct affiliate, and updates internal balances.
     */
    static async processConversion(payload: CommissionPayload): Promise<{ success: boolean; message: string; data?: any }> {
        const admin = getAdminClient();
        const { orgId, integrationSource, customerEmail, revenue, referralCode, externalCustomerId, externalChargeId } = payload;

        if (!orgId || !customerEmail) {
            return { success: false, message: 'Missing orgId or customerEmail' };
        }

        let affiliateId: string | null = null;
        let campaignId: string | null = null;

        // 1. Try to find the affiliate explicitly via the provided referralCode (e.g. from checkout metadata)
        if (referralCode) {
            const { data: affiliate } = await admin
                .from('affiliates')
                .select('id, campaign_id')
                .eq('org_id', orgId)
                .eq('referral_code', referralCode)
                .maybeSingle();

            if (affiliate) {
                affiliateId = affiliate.id;
                campaignId = affiliate.campaign_id;
            }
        }

        // 2. If no referral code was present (or it was invalid), fallback to scanning existing referrals to support recurring subscriptions
        if (!affiliateId) {
            const { data: existingReferral } = await admin
                .from('referrals')
                .select('affiliate_id, affiliates ( campaign_id )')
                .eq('org_id', orgId)
                .eq('customer_email', customerEmail)
                .maybeSingle();

            if (existingReferral) {
                affiliateId = existingReferral.affiliate_id;
                // Safely cast or extract campaign_id deeply
                const mappedAffiliate = existingReferral.affiliates as any;
                campaignId = mappedAffiliate ? mappedAffiliate.campaign_id : null;
            }
        }

        // If we STILL don't have an affiliate ID mapped, this sale is organic (not affiliate driven), so we ignore it gracefully.
        if (!affiliateId) {
            return { success: true, message: 'Sale processed, but no affiliate attribution was matched (organic sale).' };
        }

        // 3. Determine commission percentages natively off the campaign
        let commissionAmount = 0;
        if (campaignId) {
            const { data: campaign } = await admin
                .from('campaigns')
                .select('default_commission_percent')
                .eq('id', campaignId)
                .single();
            
            if (campaign) {
                const rev = parseFloat(revenue.toString());
                commissionAmount = (rev * (campaign.default_commission_percent / 100));
            }
        }

        // 4. Ensure the Referral object is tracked & linked mapping the gateway params
        const { data: referral, error: referralError } = await admin
            .from('referrals')
            .upsert({
                org_id: orgId,
                affiliate_id: affiliateId,
                customer_email: customerEmail,
                integration_source: integrationSource,
                external_customer_id: externalCustomerId, // e.g., cus_xxxxx
                status: 'active'
            }, { onConflict: 'customer_email' }) // assumes customer_email is unique across referrrals globally
            .select('id')
            .single();

        if (referralError) {
            console.error('[CommissionService] Referral Upsert Error:', referralError);
            return { success: false, message: 'Failed to create or update referral record.' };
        }

        // 5. Build the Commission Record
        const { error: commError } = await admin
            .from('commissions')
            .insert({
                org_id: orgId,
                affiliate_id: affiliateId,
                referral_id: referral.id,
                customer_email: customerEmail,
                revenue: revenue,
                commission_amount: commissionAmount,
                amount: commissionAmount,
                integration_source: integrationSource,
                external_charge_id: externalChargeId,
                status: 'pending' // Default status, wait for payout cycles etc.
            });

        if (commError) {
            console.error('[CommissionService] Commission Insert Error:', commError);
            return { success: false, message: 'Failed to record commission generation.' };
        }

        // 6. Update the Affiliate's Aggregate Total Balances organically!
        // Get current
        const { data: currentAffiliate } = await admin
            .from('affiliates')
            .select('total_commission')
            .eq('id', affiliateId)
            .single();
            
        const newTotal = (currentAffiliate?.total_commission || 0) + commissionAmount;
        
        await admin
            .from('affiliates')
            .update({ total_commission: newTotal })
            .eq('id', affiliateId);

        return { 
            success: true, 
            message: 'Conversion allocated successfully.',
            data: { affiliateId, commissionAmount, revenue } 
        };
    }
}
