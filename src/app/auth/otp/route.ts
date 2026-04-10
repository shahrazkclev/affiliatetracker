import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
        return NextResponse.redirect(`${origin}/login?error=Invalid+login+link`);
    }

    const supabase = await createClient();

    // Verify the OTP token (extracted from Supabase generateLink's action_link)
    const { data, error } = await supabase.auth.verifyOtp({
        email: decodeURIComponent(email),
        token: decodeURIComponent(token),
        type: 'magiclink',
    });

    if (error || !data.user) {
        console.error('[/auth/otp] verifyOtp error:', error?.message);
        return NextResponse.redirect(
            `${origin}/login?error=Login+link+expired.+Please+request+a+new+one.`
        );
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if org owner → send to admin dashboard
    const { data: org } = await admin
        .from('organizations')
        .select('id')
        .eq('owner_id', data.user.id)
        .maybeSingle();

    if (org) {
        return NextResponse.redirect(`${origin}/admin`);
    }

    // Affiliate → send to portal
    return NextResponse.redirect(`${origin}/portal`);
}
