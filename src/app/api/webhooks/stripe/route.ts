import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { verifyAndPromptRevenueUpgrade } from "@/lib/limits";

// Stripe sends the raw body for signature verification — must disable body parsing
export const runtime = 'nodejs';

// Verify Stripe webhook signature using raw body + secret
async function verifyStripeSignature(
    rawBody: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
            const [k, v] = part.split('=');
            acc[k] = v;
            return acc;
        }, {});

        const timestamp = parts['t'];
        const sig = parts['v1'];
        if (!timestamp || !sig) return false;

        // Compute expected signature via WebCrypto
        const payload = `${timestamp}.${rawBody}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(payload);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        const expectedSig = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return sig === expectedSig;
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Create a service-role admin client to bypass RLS since webhooks drop cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Get org's webhook secret
    const { data: org } = await supabase
        .from('organizations')
        .select('id, stripe_webhook_secret, stripe_secret_key, owner_id')
        .limit(1)
        .single();
        
    const webhookSecret = org?.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[webhook] No webhook secret configured');
        return NextResponse.json({ error: 'Not configured' }, { status: 400 });
    }

    // Verify signature
    const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
        console.error('[webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log(`[webhook] Received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                await handleCheckoutSession(supabase, org, event.data.object);
                break;
            }
            case 'customer.subscription.created': {
                // Subscription may have metadata.affiliate_ref set by client code
                await handleSubscription(supabase, org, event.data.object);
                break;
            }
            case 'invoice.payment_succeeded': {
                // Handle recurring commissions
                await handleInvoicePayment(supabase, org, event.data.object);
                break;
            }
            default:
                // Unhandled — return 200 to acknowledge
                break;
        }
    } catch (err: any) {
        console.error(`[webhook] Handler error for ${event.type}:`, err.message);
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

// ─── Handlers ──────────────────────────────────────────────────────────────

async function handleCheckoutSession(supabase: any, org: any, session: any) {
    // client_reference_id is set by the tracking snippet to the affiliate's ref code
    // It may now be a tracking payload: "refCode---tag---uuid"
    const rawRefCode = session.client_reference_id;
    const amount  = (session.amount_total || 0) / 100; // Stripe returns cents
    const currency = session.currency || 'usd';
    const stripeChargeId = session.payment_intent || session.id;
    // 100% free checkouts might drop the customer_details email, fallback to a placeholder so it doesn't violate NOT NULL constraints
    const customerEmail = session.customer_details?.email || session.customer_email || `unknown_${session.id}@stripe.com`;

    let refCode = rawRefCode || null;
    let explicitAffiliateId = null;
    let trackingTag = null;
    let matchedAffiliate: any = null;

    if (!rawRefCode) {
        const hasDiscounts = (session.total_details?.amount_discount > 0) || (session.total_details?.breakdown?.discounts?.length > 0) || (session.discounts?.length > 0);
        if (!hasDiscounts) {
            console.log('[webhook] checkout.session.completed — no client_reference_id and no discounts, skipping commission');
            return;
        }

        console.log('[webhook] No client_reference_id but found discounts. Attempting promo code resolution...');
        const stripeKey = org.stripe_secret_key || process.env.STRIPE_SECRET_KEY;

        if (stripeKey) {
            try {
                const Stripe = require('stripe').default || require('stripe');
                const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
                const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ['total_details.breakdown.discounts.discount.promotion_code', 'discounts', 'discounts.promotion_code']
                });

                const expandedDiscounts = expandedSession.total_details?.breakdown?.discounts?.length 
                    ? expandedSession.total_details.breakdown.discounts 
                    : (expandedSession.discounts || []);
                
                for (const d of expandedDiscounts) {
                    const discountObj = d.discount || d; // Handle both discount breakdown objects and direct discount objects
                    const couponId = discountObj?.coupon?.id || (typeof discountObj?.coupon === 'string' ? discountObj.coupon : null);
                    const promoObj = discountObj?.promotion_code as any;
                    let promoCodeText = typeof promoObj === 'string' ? null : promoObj?.code;

                    if (typeof promoObj === 'string' && promoObj.startsWith('prc_')) {
                        try {
                            const fetchedPromo = await stripe.promotionCodes.retrieve(promoObj);
                            promoCodeText = fetchedPromo.code;
                        } catch (e) {
                            console.error('[webhook] Error fetching promotion code:', e);
                        }
                    }

                    if (promoCodeText || couponId) {
                        let q = supabase
                            .from('affiliates')
                            .select('id, campaign_id, total_commission')
                            .eq('org_id', org.id);
                        
                        // Check both the human-readable code and the stripe ID against whatever we found
                        if (promoCodeText) {
                            q = q.or(`stripe_promo_code.ilike.${promoCodeText},stripe_promo_id.eq.${promoCodeText}`);
                        } else if (couponId) {
                            q = q.or(`stripe_promo_code.ilike.${couponId},stripe_promo_id.eq.${couponId}`);
                        }

                        const { data: aff } = await q.maybeSingle();
                        if (aff) {
                            matchedAffiliate = aff;
                            break; // Stop looking once we map a commission
                        }
                    }
                }
            } catch (e) {
                console.error('[webhook] Error fetching expanded session for promo code:', e);
            }
        }

        // Fallback: If SDK fails or no key, match via raw coupon.id
        const fallbackDiscounts = session.total_details?.breakdown?.discounts || session.discounts || [];
        const firstDiscountObj = fallbackDiscounts[0]?.discount || fallbackDiscounts[0];
        const firstCouponId = firstDiscountObj?.coupon?.id || (typeof firstDiscountObj?.coupon === 'string' ? firstDiscountObj.coupon : null);
        
        if (!matchedAffiliate && firstCouponId) {
            const { data: aff } = await supabase
                .from('affiliates')
                .select('id, campaign_id, total_commission')
                .eq('org_id', org.id)
                .or(`stripe_promo_code.ilike.${firstCouponId},stripe_promo_id.eq.${firstCouponId}`)
                .maybeSingle();
            if (aff) matchedAffiliate = aff;
        }

        if (!matchedAffiliate) {
            console.log('[webhook] checkout.session.completed — no tracking link and no matching promo affiliate');
            return;
        }

        explicitAffiliateId = matchedAffiliate.id;
    } else {
        if (rawRefCode.includes('---')) {
            const parts = rawRefCode.split('---');
            refCode = parts[0];
            if (parts.length >= 2 && parts[1]) trackingTag = parts[1];
            if (parts.length >= 3) explicitAffiliateId = parts[2];
        }

        // Find affiliate by referral_code or explicit ID
        let query = supabase
            .from('affiliates')
            .select('id, campaign_id, total_commission')
            .eq('org_id', org.id);

        if (explicitAffiliateId) {
            query = query.eq('id', explicitAffiliateId);
        } else {
            query = query.eq('referral_code', refCode);
        }

        const { data: affiliate } = await query.single();
        matchedAffiliate = affiliate;
    }

    if (!matchedAffiliate) {
        console.warn(`[webhook] No affiliate found for tracking resolution (ref: ${rawRefCode})`);
        return;
    }
    
    const affiliate = matchedAffiliate;

    // Get campaign commission rate
    const { data: campaign } = affiliate.campaign_id
        ? await supabase
            .from('campaigns')
            .select('default_commission_percent')
            .eq('id', affiliate.campaign_id)
            .single()
        : { data: null };

    const commissionRate = campaign?.default_commission_percent || 20; // default 20%
    const commissionAmount = Math.round(amount * (commissionRate / 100) * 100) / 100;

    // 1. Try to find existing referral
    let referralData = null;
    try {
        const { data: existingRef } = await supabase
            .from('referrals')
            .select('id')
            .eq('customer_email', customerEmail)
            .eq('affiliate_id', affiliate.id)
            .limit(1)
            .single();
        
        if (existingRef) {
            referralData = existingRef;
        } else {
            // 2. If not found, insert a new referral
            const { data: newRef, error: refErr } = await supabase.from('referrals').insert({
                org_id: org.id,
                affiliate_id: affiliate.id,
                customer_email: customerEmail,
                stripe_customer_id: session.customer || null,
                status: session.mode === 'subscription' ? 'active' : null,
                sub_id: trackingTag,
                created_at: new Date().toISOString(),
            }).select('id').single();

            if (refErr) {
                console.error('[webhook] Failed to create referral:', refErr.message);
            } else {
                referralData = newRef;
            }
        }
    } catch (e) {
        console.error('[webhook] Exception fetching/creating referral:', e);
    }

    // Create commission record
    const { error: commErr } = await supabase.from('commissions').insert({
        org_id: org.id,
        affiliate_id: affiliate.id,
        referral_id: referralData?.id || null,  // Link to the referral
        revenue: amount,
        commission_amount: commissionAmount,
        amount: commissionAmount,
        stripe_charge_id: stripeChargeId,
        status: 'pending',
        sub_id: trackingTag,
        created_at: new Date().toISOString(),
    });

    if (commErr) {
        console.error('[webhook] Failed to create commission:', commErr.message, commErr.details);
        return;
    }

    // Update affiliate total_commission
    await supabase
        .from('affiliates')
        .update({ total_commission: (Number(affiliate.total_commission) || 0) + commissionAmount })
        .eq('id', affiliate.id);

    console.log(`[webhook] ✓ Commission $${commissionAmount} created for affiliate ${affiliate.id} (ref: ${refCode})`);
    
    try {
        const { data: affiliateData } = await supabase.from('affiliates').select('first_name, email, org_id').eq('id', affiliate.id).single();
        let adminEmail = undefined;
        if (org.owner_id) {
            const { data: adminUser } = await supabase.auth.admin.getUserById(org.owner_id);
            if (adminUser?.user?.email) adminEmail = adminUser.user.email;
        }

        const { dispatchEmail } = await import('@/lib/email');
        const { NEW_COMMISSION_TEMPLATE } = await import('@/lib/email-templates');

        // To Affiliate
        if (affiliateData?.email) {
            await dispatchEmail(org.id, {
                to: affiliateData.email,
                subject: 'New Commission Earned! 💰',
                html: NEW_COMMISSION_TEMPLATE(affiliateData.first_name || 'Partner', commissionAmount.toFixed(2), customerEmail),
                _rawHtmlOverride: true
            } as any);
        }

        // To Admin
        if (adminEmail) {
            const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f9fafb; padding: 20px;">
  <div style="background: white; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb;">
      <h2 style="color: #111827; margin-top: 0;">New Affiliate Sale! 🎉</h2>
      <p style="color: #4b5563;">A new sale was just tracked through your affiliate program.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Revenue:</strong> $${amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Commission:</strong> $${commissionAmount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Code/Tag:</strong> ${trackingTag || refCode}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerEmail || 'Unknown'}</p>
          <p style="margin: 5px 0;"><strong>Affiliate:</strong> ${affiliateData?.first_name || 'Partner'} (${affiliateData?.email || 'Unknown'})</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">View the details in your SuperAdmin dashboard.</p>
  </div>
</body>
</html>`;
            await dispatchEmail(org.id, {
                to: adminEmail,
                subject: 'New Affiliate Sale Tracked',
                html: adminHtml,
                _rawHtmlOverride: true
            } as any);
        }
    } catch (e) {
        console.error('[webhook] Failed to dispatch referral emails:', e);
    }

    // Background execution: check revenue limits and notify organization admin
    verifyAndPromptRevenueUpgrade(org.id).catch(err => console.error('[webhook limits] error', err));
}

async function handleSubscription(supabase: any, org: any, subscription: any) {
    let refCode = subscription.metadata?.affiliate_ref;
    
    if (!refCode) {
        // Fallback to tracking via email in case metadata wasn't passed by customer implementation
        const email = subscription.customer_email || (await resolveCustomerEmail(subscription.customer, org.stripe_secret_key));
        if (!email) return;
        
        const { data: ref } = await supabase.from('referrals').select('affiliate(referral_code)').eq('customer_email', email).eq('org_id', org.id).maybeSingle();
        if (ref?.affiliate?.referral_code) refCode = ref.affiliate.referral_code;
    }

    if (!refCode) return;

    // Mimic checkout session handling with subscription amount
    const amount = (subscription.items?.data?.[0]?.price?.unit_amount || 0) / 100;
    await handleCheckoutSession(supabase, org, {
        client_reference_id: refCode,
        amount_total: amount * 100,
        currency: subscription.currency,
        payment_intent: subscription.latest_invoice,
        customer_details: { email: subscription.customer_email },
        customer: subscription.customer,
    });
}

// Helper to resolve stripe customer emails cleanly
async function resolveCustomerEmail(customerId: string, stripeKey: string) {
    if (!customerId || !stripeKey) return null;
    try {
        const Stripe = require('stripe').default || require('stripe');
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
        const cust = await stripe.customers.retrieve(customerId);
        return cust?.email || null;
    } catch (e) {
        return null;
    }
}

async function handleInvoicePayment(supabase: any, org: any, invoice: any) {
    // Only handle subscription renewals, not the first payment (already handled by checkout.session)
    if (invoice.billing_reason !== 'subscription_cycle') return;

    let refCode = invoice.subscription_details?.metadata?.affiliate_ref;
    
    if (!refCode) {
        // Fallback to auto-matching past referrals via invoice customer email
        const email = invoice.customer_email || (await resolveCustomerEmail(invoice.customer, org.stripe_secret_key));
        if (!email) return;
        
        const { data: ref } = await supabase.from('referrals').select('affiliate(referral_code)').eq('customer_email', email).eq('org_id', org.id).maybeSingle();
        if (ref?.affiliate?.referral_code) refCode = ref.affiliate.referral_code;
    }

    if (!refCode) return;

    await handleCheckoutSession(supabase, org, {
        client_reference_id: refCode,
        amount_total: invoice.amount_paid,
        currency: invoice.currency,
        payment_intent: invoice.payment_intent,
        customer_details: { email: invoice.customer_email },
        customer: invoice.customer,
    });
}
