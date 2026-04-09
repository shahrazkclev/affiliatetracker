import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, url, referrer } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: 'No code provided' }, { status: 400, headers: corsHeaders });
        }

        // Parse code for tag if using format "REFCODE+TAG"
        const [refCode, ...tagParts] = code.split('+');
        const tag = tagParts.join('+') || null;

        const admin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find the affiliate by referral code
        const { data: affiliate } = await admin
            .from('affiliates')
            .select('id, clicks')
            .eq('referral_code', refCode)
            .single();

        if (!affiliate) {
            return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404, headers: corsHeaders });
        }

        // Extract client info
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // 1. Insert into click_events table
        const { error: insertError } = await admin
            .from('click_events')
            .insert({
                affiliate_id: affiliate.id,
                sub_id: tag,
                referer: referrer || null,
                user_agent: userAgent,
                ip_address: ipAddress
            });

        if (insertError) {
            console.error('Failed to log click event:', insertError);
        }

        // 2. Increment global clicks on the affiliate
        const currentClicks = affiliate.clicks || 0;
        await admin
            .from('affiliates')
            .update({ clicks: currentClicks + 1 })
            .eq('id', affiliate.id);

        return NextResponse.json({ success: true }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
