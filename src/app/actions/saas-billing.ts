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

    const planIdOrName = formData.get('plan') as string;

    // Get the tenant's exact organization ID
    const { data: org } = await supabase
        .from('organizations')
        .select('id, stripe_customer_id, owner_id')
        .eq('owner_id', user.id)
        .single();

    if (!org) {
        throw new Error('Organization not found for checkout.');
    }

    // Fetch the plan directly from the database
    // We use the admin client here just in case they're trying to checkout 
    // a plan that might just have been disabled, or to bypass RLS safely
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Resolve plan by ID or legacy name
    let planData;
    if (planIdOrName === 'base' || planIdOrName === 'pro') {
        const { data } = await admin.from('saas_plans').select('*').ilike('name', `${planIdOrName}%`).single();
        planData = data;
    } else {
        const { data } = await admin.from('saas_plans').select('*').eq('id', planIdOrName).single();
        planData = data;
    }

    if (!planData || !planData.stripe_price_id) {
        throw new Error("Invalid plan selected or plan is missing a Stripe Price ID.");
    }

    const priceId = planData.stripe_price_id;

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

        // Save the bare customer ID early
        await admin.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org.id);
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
            plan_id: planData.id
        },
        subscription_data: {
            metadata: {
                org_id: org.id,       // extremely critical for webhooks!
                plan_id: planData.id  // New payload passing the dynamic plan UI
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
