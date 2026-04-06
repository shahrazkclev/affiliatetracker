import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/portal';

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Password recovery — go straight to reset page, skip all checks
            if (next === '/reset-password') {
                return NextResponse.redirect(`${origin}/reset-password`);
            }

            const admin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Check if this user has an affiliate record
            const { data: affiliate } = await admin
                .from('affiliates')
                .select('id, status')
                .eq('user_id', data.user.id)
                .maybeSingle();

            if (!affiliate) {
                // New user — send to fill in application details
                return NextResponse.redirect(`${origin}/apply/details`);
            }

            // Check if they have a password set (first login after approval)
            const { data: pwCheck } = await admin.rpc('check_user_has_password', {
                user_email: data.user.email,
            });
            const hasPassword = pwCheck?.[0]?.has_password ?? false;

            if (!hasPassword) {
                // Approved affiliate logging in for first time — set password
                return NextResponse.redirect(`${origin}/set-password`);
            }

            // Returning user with password — go to portal
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could not sign in`);
}

