import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const next = searchParams.get('next') ?? '/portal';
    const type = (searchParams.get('type') as 'magiclink' | 'recovery') || 'magiclink';

    if (!token) {
        return NextResponse.redirect(`${origin}/login?error=Invalid+login+link`);
    }

    const cleanToken = decodeURIComponent(token);
    const cleanEmail = email ? decodeURIComponent(email) : '';
    const isTokenHash = cleanToken.length > 20 || /^[a-f0-9]{32,64}$/i.test(cleanToken);

    const supabase = await createClient();

    // Verify OTP (support both hashed PKCE tokens and numeric OTP codes)
    const { data, error } = isTokenHash
        ? await supabase.auth.verifyOtp({
            token_hash: cleanToken,
            type: type as any,
        })
        : await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: type as any,
        });

    if (error || !data.user) {
        console.error('[/auth/otp] verifyOtp error:', error?.message);
        return NextResponse.redirect(
            `${origin}/login?error=Login+link+expired.+Please+request+a+new+one.`
        );
    }

    if (type === 'recovery' || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`);
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

    // Otherwise check affiliate record (match by user_id or email)
    const { data: affiliates } = await admin
        .from('affiliates')
        .select('id, status, user_id')
        .or(`user_id.eq.${data.user.id},email.eq.${data.user.email}`)
        .limit(1);

    const affiliate = affiliates && affiliates.length > 0 ? affiliates[0] : null;

    if (affiliate) {
        if (!affiliate.user_id) {
            await admin
                .from('affiliates')
                .update({ user_id: data.user.id })
                .eq('id', affiliate.id);
        }

        if (affiliate.status === 'pending') {
            return NextResponse.redirect(`${origin}/applied`);
        }
    }

    if (!affiliate) {
        return NextResponse.redirect(`${origin}/apply`);
    }

    // Check if password set
    const { data: pwCheck } = await admin.rpc('check_user_has_password', {
        user_email: data.user.email,
    });
    const hasPassword = pwCheck?.[0]?.has_password ?? false;

    if (!hasPassword) {
        return NextResponse.redirect(`${origin}/set-password`);
    }

    return NextResponse.redirect(`${origin}${next}`);
}
