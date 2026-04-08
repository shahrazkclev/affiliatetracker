import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need an admin client for webhooks to bypass RLS since the client isn't authenticated as a user
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Missing Bearer token.' }, { status: 401 });
        }

        const apiKey = authHeader.split('Bearer ')[1].trim();

        const admin = getAdminClient();

        // Let's assume the API Key is mapped to the organization ID for now as a UUID
        const { data: org, error: orgError } = await admin
            .from('organizations')
            .select('id')
            .eq('id', apiKey) // Using org_id directly as the secret key logic for now
            .maybeSingle();

        if (orgError || !org) {
            return NextResponse.json({ success: false, error: 'Invalid API Key or Organization not found.' }, { status: 401 });
        }

        const orgId = org.id;
        const body = await req.json();

        // Expected Payload format for custom webhook:
        // {
        //   "event": "referral.conversion",
        //   "data": {
        //     "referral_code": "johndoe",
        //     "customer_email": "newcustomer@example.com",
        //     "revenue": 100.00
        //   }
        // }

        const event = body.event;
        const payloadData = body.data;

        if (!event || !payloadData) {
            return NextResponse.json({ success: false, error: 'Malformed payload. Missing event or data.' }, { status: 400 });
        }

        if (event === 'referral.conversion') {
            const { referral_code, customer_email, revenue } = payloadData;

            if (!referral_code || !customer_email) {
                return NextResponse.json({ success: false, error: 'Missing referral_code or customer_email in data.' }, { status: 400 });
            }

            // 1. Find affiliate mapped to this referral_code AND org_id
            const { data: affiliate } = await admin
                .from('affiliates')
                .select('id, campaign_id')
                .eq('org_id', orgId)
                .eq('referral_code', referral_code)
                .maybeSingle();

            if (!affiliate) {
                return NextResponse.json({ success: false, error: 'Affiliate not found for this organization and code.' }, { status: 404 });
            }

            let commissionAmount = 0;
            // 2. Determine commission based on campaign
            if (affiliate.campaign_id) {
                const { data: campaign } = await admin
                    .from('campaigns')
                    .select('default_commission_percent')
                    .eq('id', affiliate.campaign_id)
                    .single();
                
                if (campaign) {
                    const rev = parseFloat(revenue || 0);
                    commissionAmount = (rev * (campaign.default_commission_percent / 100));
                }
            }

            // 3. Upsert referral
            const { data: referral, error: referralError } = await admin
                .from('referrals')
                .upsert({
                    org_id: orgId,
                    affiliate_id: affiliate.id,
                    customer_email: customer_email,
                    status: 'active'
                }, { onConflict: 'customer_email' })
                .select('id')
                .single();

            if (referralError) throw referralError;

            // 4. Insert commission
            const { error: commError } = await admin
                .from('commissions')
                .insert({
                    org_id: orgId,
                    affiliate_id: affiliate.id,
                    referral_id: referral.id,
                    customer_email: customer_email,
                    revenue: parseFloat(revenue || 0),
                    commission_amount: commissionAmount,
                    amount: commissionAmount,
                    status: 'pending'
                });

            if (commError) throw commError;

            return NextResponse.json({ success: true, message: 'Conversion recorded successfully.' });
        }

        return NextResponse.json({ success: false, error: 'Unknown event type.' }, { status: 400 });

    } catch (error: any) {
        console.error('Custom Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
