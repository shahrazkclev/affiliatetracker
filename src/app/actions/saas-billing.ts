'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.SAAS_STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any, // Standard fixed version
});

export async function createSaasCheckoutSession(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const planType = formData.get('plan') as 'base' | 'pro' || 'pro';

    // Get the tenant's exact organization ID
    const { data: org } = await supabase
        .from('organizations')
        .select('id, stripe_customer_id, owner_id')
        .eq('owner_id', user.id)
        .single();

    if (!org) {
        throw new Error('Organization not found for checkout.');
    }

    let customerId = org.stripe_customer_id;

    // If they don't have a Stripe Customer ID yet, create one!
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
                org_id: org.id
            }
        });
        customerId = customer.id;

        // Optionally, save the bare customer ID early without making them type a credit card yet string
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await admin.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org.id);
    }

    const priceId = planType === 'pro' 
        ? process.env.NEXT_PUBLIC_STRIPE_SAAS_PRO_PRICE_ID 
        : process.env.NEXT_PUBLIC_STRIPE_SAAS_BASE_PRICE_ID;

    if (!priceId) {
        throw new Error("Stripe Price ID is not set in your .env.local file yet.");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard.affiliatemango.com';

    // Create the session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        metadata: {
            org_id: org.id,
            plan_name: planType
        },
        subscription_data: {
            metadata: {
                org_id: org.id // extremely critical for webhooks!
            }
        },
        success_url: `${siteUrl}/admin/billing?success=true`,
        cancel_url: `${siteUrl}/admin/billing?canceled=true`,
    });

    if (session.url) {
        redirect(session.url);
    }
}

export async function createSaasPortalSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { data: org } = await supabase
        .from('organizations')
        .select('stripe_customer_id')
        .eq('owner_id', user.id)
        .single();

    if (!org?.stripe_customer_id) {
        throw new Error("No active billing profile to manage.");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard.affiliatemango.com';

    const session = await stripe.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${siteUrl}/admin/billing`,
    });

    if (session.url) {
        redirect(session.url);
    }
}
