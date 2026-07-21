import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/portal';
    const returnToParam = searchParams.get('return_to') ?? '';

    // Resolve domain origin, filtering out netlify preview subdomains
    const hostHeader = request.headers.get('x-mango-tenant-host') || request.headers.get('host') || request.headers.get('x-forwarded-host') || '';
    const rawHost = hostHeader.split(',')[0].trim().split(':')[0].toLowerCase();
    
    let origin: string;
    if (rawHost && !rawHost.endsWith('.netlify.app')) {
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        origin = `${proto}://${rawHost}`;
    } else {
        const { getPortalSiteUrl } = await import('@/lib/auth-urls');
        origin = await getPortalSiteUrl();
    }

    if (code) {
        const redirectUrl = `${origin.replace(/\/$/, '')}${next.startsWith('/') ? next : `/${next}`}`;
        const response = NextResponse.redirect(redirectUrl);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            const admin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Password recovery — look up custom domain from DB and go to reset page
            if (next === '/reset-password') {
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
                return NextResponse.redirect(resetUrl.toString(), { headers: response.headers });
            }

            // Platform owner onboarding
            if (next.startsWith('/register/')) {
                return NextResponse.redirect(`${origin}${next}`, { headers: response.headers });
            }

            // Platform owner returning after verification
            const { data: org } = await admin
                .from('organizations')
                .select('id')
                .eq('owner_id', data.user.id)
                .maybeSingle();

            if (org) {
                return NextResponse.redirect(`${origin}/admin`, { headers: response.headers });
            }

            // Otherwise, check if this user has an affiliate record (match by user_id or email)
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
                    return NextResponse.redirect(`${origin}/applied`, { headers: response.headers });
                }
            }

            if (!affiliate) {
                return NextResponse.redirect(`${origin}/apply`, { headers: response.headers });
            }

            // Check if they have a password set (first login after approval)
            const { data: pwCheck } = await admin.rpc('check_user_has_password', {
                user_email: data.user.email,
            });
            const hasPassword = pwCheck?.[0]?.has_password ?? false;

            if (!hasPassword) {
                return NextResponse.redirect(`${origin}/set-password`, { headers: response.headers });
            }

            return NextResponse.redirect(`${origin}${next}`, { headers: response.headers });
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could+not+sign+in`);
}
