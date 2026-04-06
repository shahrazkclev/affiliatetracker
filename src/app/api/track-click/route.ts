import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, url, referrer } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: 'No code provided' }, { status: 400 });
        }

        // Parse code for tag if using format "REFCODE+TAG"
        const [refCode, ...tagParts] = code.split('+');
        const tag = tagParts.join('+') || null;

        const supabase = await createClient();

        // Find the affiliate by referral code
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, clicks')
            .eq('referral_code', refCode)
            .single();

        if (!affiliate) {
            return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 });
        }

        // Extract client info
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // 1. Insert into click_events table
        const { error: insertError } = await supabase
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

        // 2. Increment global clicks on the affiliate (using an RPC if possible, otherwise read/update)
        // Since we don't know if there's an RPC, we just increment based on the read value.
        // It's a soft counter, so typical race conditions are acceptable.
        const currentClicks = affiliate.clicks || 0;
        await supabase
            .from('affiliates')
            .update({ clicks: currentClicks + 1 })
            .eq('id', affiliate.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
