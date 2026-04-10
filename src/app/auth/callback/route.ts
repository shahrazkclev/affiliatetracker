import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/portal';
    // return_to may still be passed in some cases, but we also resolve it from DB below
    const returnToParam = searchParams.get('return_to') ?? '';

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            const admin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Password recovery — look up custom domain from DB and go to reset page
            if (next === '/reset-password') {
                // Try param first, then look up from DB using the authenticated user
                let returnTo = returnToParam;

                if (!returnTo) {
                    const { data: affiliate } = await admin
                        .from('affiliates')
                        .select('org_id')
                        .eq('email', data.user.email!)
                        .maybeSingle();

                    if (affiliate?.org_id) {
                        const { data: org } = await admin
                            .from('organizations')
                            .select('custom_domain')
                            .eq('id', affiliate.org_id)
                            .maybeSingle();
                        returnTo = org?.custom_domain ?? '';
                    }
                }

                const resetUrl = new URL(`${origin}/reset-password`);
                if (returnTo) resetUrl.searchParams.set('return_to', returnTo);
                return NextResponse.redirect(resetUrl.toString());
            }

            // First, check if this is a Platform Owner (Admin)
            const { data: org } = await admin
                .from('organizations')
                .select('id')
                .eq('owner_id', data.user.id)
                .maybeSingle();

            if (org) {
                // Return platform owners directly to their dashboard!
                return NextResponse.redirect(`${origin}/admin`);
            }

            // Otherwise, check if this user has an affiliate record
            const { data: affiliate } = await admin
                .from('affiliates')
                .select('id, status')
                .eq('user_id', data.user.id)
                .maybeSingle();

            if (!affiliate) {
                // New user — send to fill in application details
                const target = next.startsWith('/apply/details') ? next : '/apply/details';
                return NextResponse.redirect(`${origin}${target}`);
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
