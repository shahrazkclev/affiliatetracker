'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function getOrg() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('organizations')
        .select('id, stripe_secret_key, stripe_webhook_secret, stripe_webhook_id, app_url')
        .limit(1)
        .single();
        
    // Fallback to environment variable if not set in DB
    if (data && !data.stripe_secret_key) {
        data.stripe_secret_key = process.env.STRIPE_SECRET_KEY || null;
    }
    
    return { supabase, org: data };
}

function stripeHeaders(key: string) {
    return { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' };
}

// ─── Connect / Disconnect ───────────────────────────────────────────────────

export async function saveStripeConnection(formData: FormData) {
    const secretKey = (formData.get('stripe_secret_key') as string)?.trim();
    const appUrl    = (formData.get('app_url') as string)?.trim().replace(/\/$/, '');

    if (!secretKey?.startsWith('sk_')) return { success: false, error: 'Key must start with sk_' };
    if (!appUrl?.startsWith('http')) return { success: false, error: 'App URL must be a full URL (https://...)' };

    // 1. Test the key by fetching account
    const testRes = await fetch('https://api.stripe.com/v1/account', {
        headers: stripeHeaders(secretKey),
    });
    if (!testRes.ok) {
        const err = await testRes.json();
        return { success: false, error: err.error?.message || 'Invalid Stripe key' };
    }

    const { supabase, org } = await getOrg();

    // 2. If we had an old webhook, delete it from Stripe first
    if (org?.stripe_webhook_id && org?.stripe_secret_key) {
        await fetch(`https://api.stripe.com/v1/webhook_endpoints/${org.stripe_webhook_id}`, {
            method: 'DELETE',
            headers: stripeHeaders(org.stripe_secret_key),
        }).catch(() => {}); // swallow errors — webhook may not exist
    }

    // 3. Register new webhook
    const webhookUrl = `${appUrl}/api/webhooks/stripe`;
    const whBody = new URLSearchParams({
        url: webhookUrl,
        'enabled_events[]': 'checkout.session.completed',
        description: 'AffiliateMango — auto-registered',
    });
    // Add more events
    ['customer.subscription.created', 'invoice.payment_succeeded'].forEach(e =>
        whBody.append('enabled_events[]', e)
    );

    const whRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        method: 'POST',
        headers: stripeHeaders(secretKey),
        body: whBody.toString(),
    });

    let webhookId = null;
    let webhookSecret = null;

    if (whRes.ok) {
        const wh = await whRes.json();
        webhookId = wh.id;
        webhookSecret = wh.secret; // only returned on creation
    } else {
        const err = await whRes.json();
        // Non-fatal — still save the key even if webhook reg fails
        console.warn('[stripe] Webhook registration failed:', err.error?.message);
    }

    // 4. Save to org
    const { error } = await supabase
        .from('organizations')
        .update({
            stripe_secret_key: secretKey,
            stripe_webhook_secret: webhookSecret,
            stripe_webhook_id: webhookId,
            app_url: appUrl,
        })
        .eq('id', org!.id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/settings');
    return {
        success: true,
        webhookUrl,
        webhookRegistered: !!webhookId,
        message: webhookId
            ? `Connected ✓ — Webhook registered at ${webhookUrl}`
            : `Key saved but webhook registration failed. Register manually: ${webhookUrl}`,
    };
}

export async function disconnectStripe() {
    const { supabase, org } = await getOrg();
    if (!org) return { success: false, error: 'No org found' };

    // Delete webhook from Stripe
    if (org.stripe_webhook_id && org.stripe_secret_key) {
        await fetch(`https://api.stripe.com/v1/webhook_endpoints/${org.stripe_webhook_id}`, {
            method: 'DELETE',
            headers: stripeHeaders(org.stripe_secret_key),
        }).catch(() => {});
    }

    const { error } = await supabase
        .from('organizations')
        .update({ stripe_secret_key: null, stripe_webhook_secret: null, stripe_webhook_id: null })
        .eq('id', org.id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function getStripeStatus() {
    const { org } = await getOrg();
    const isConnected = !!org?.stripe_secret_key;
    const webhookId = org?.stripe_webhook_id || null;
    const appUrl = org?.app_url || null;

    if (!isConnected) return { connected: false, webhookId: null, appUrl };

    // Live-check the key
    const res = await fetch('https://api.stripe.com/v1/account', {
        headers: stripeHeaders(org!.stripe_secret_key!),
    });
    const isLive = res.ok;
    const account = isLive ? await res.json() : null;

    return {
        connected: isLive,
        displayName: account?.settings?.dashboard?.display_name || account?.email,
        mode: org!.stripe_secret_key!.startsWith('sk_live') ? 'live' : 'test',
        webhookId,
        webhookUrl: appUrl ? `${appUrl}/api/webhooks/stripe` : null,
        appUrl,
    };
}

// ─── Promo Codes ────────────────────────────────────────────────────────────

export async function listStripeCoupons() {
    const { org } = await getOrg();
    if (!org?.stripe_secret_key) return { success: false, error: 'Stripe not connected', coupons: [] };

    const res = await fetch('https://api.stripe.com/v1/coupons?limit=100', {
        headers: stripeHeaders(org.stripe_secret_key),
        cache: 'no-store',
    });
    if (!res.ok) return { success: false, error: 'Failed to fetch coupons', coupons: [] };
    const data = await res.json();
    return {
        success: true,
        coupons: (data.data || []).map((c: any) => ({
            id: c.id,
            name: c.name || c.id,
            percent_off: c.percent_off,
            amount_off: c.amount_off,
            currency: c.currency,
            duration: c.duration,
        })),
    };
}

export async function createStripeCoupon(name: string, percentOff: number) {
    const { org } = await getOrg();
    if (!org?.stripe_secret_key) return { success: false, error: 'Stripe not connected' };

    const body = new URLSearchParams({
        name,
        duration: 'forever',
        percent_off: percentOff.toString(),
    });

    const res = await fetch('https://api.stripe.com/v1/coupons', {
        method: 'POST',
        headers: stripeHeaders(org.stripe_secret_key),
        body: body.toString(),
    });

    if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Failed to create coupon' };
    }

    return { success: true };
}

export async function listStripePromoCodes() {
    const { org } = await getOrg();
    if (!org?.stripe_secret_key) return { success: false, error: 'Stripe not connected', codes: [] };

    const res = await fetch('https://api.stripe.com/v1/promotion_codes?limit=100&active=true', {
        headers: stripeHeaders(org.stripe_secret_key),
        cache: 'no-store',
    });
    if (!res.ok) return { success: false, error: 'Failed to fetch promo codes', codes: [] };
    const data = await res.json();
    return {
        success: true,
        codes: (data.data || []).map((p: any) => ({
            id: p.id,
            code: p.code,
            coupon_name: p.coupon?.name || p.coupon?.id || '—',
            percent_off: p.coupon?.percent_off ?? null,
            amount_off: p.coupon?.amount_off ?? null,
            times_redeemed: p.times_redeemed,
        })),
    };
}

export async function createStripePromoCode(couponId: string, customCode: string) {
    const { org } = await getOrg();
    if (!org?.stripe_secret_key) return { success: false, error: 'Stripe not connected' };

    const body = new URLSearchParams({ coupon: couponId });
    if (customCode?.trim()) body.append('code', customCode.trim().toUpperCase());

    const res = await fetch('https://api.stripe.com/v1/promotion_codes', {
        method: 'POST',
        headers: stripeHeaders(org.stripe_secret_key),
        body: body.toString(),
    });

    if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Failed to create promo code' };
    }

    const promo = await res.json();
    return { success: true, code: promo.code, id: promo.id };
}
