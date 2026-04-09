import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.SAAS_STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.SAAS_STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is not defined in this environment!");
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                
                // Get the subscription ID and the metadata we injected when creating the session
                const subscriptionId = session.subscription as string;
                const orgId = session.metadata?.org_id;
                const planId = session.metadata?.plan_id;
                const planName = session.metadata?.plan_name || 'pro'; // legacy fallback

                if (!orgId) {
                    console.error('No org_id found in metadata');
                    break;
                }

                await supabase.from('organizations').update({
                    stripe_subscription_id: subscriptionId,
                    plan_status: 'active',
                    plan_name: planName, // keep legacy field for backward compatibility
                    ...(planId ? { plan_id: planId } : {}) // Update plan_id if provided
                }).eq('id', orgId);

                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const orgId = subscription.metadata.org_id;
                
                if (!orgId) break;

                await supabase.from('organizations').update({
                    plan_status: subscription.status,
                }).eq('id', orgId);

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const orgId = subscription.metadata.org_id;
                
                if (!orgId) break;

                await supabase.from('organizations').update({
                    plan_status: 'canceled',
                }).eq('id', orgId);

                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
