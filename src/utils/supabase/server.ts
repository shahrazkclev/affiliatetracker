import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

import { headers } from 'next/headers';

export async function getResolvedOrgId(): Promise<string | null> {
    const h = await headers();
    const slug = h.get('x-org-slug');
    const rawHost = h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "";
    // x-forwarded-host could be a comma-separated list, take the first one
    const primaryHost = rawHost.split(',')[0].trim();
    // strip the port
    const hostname = primaryHost.split(':')[0].toLowerCase();
    
    const isGenericPartners = hostname === 'partners.affiliatemango.com';
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isDashboard = hostname === 'dashboard.affiliatemango.com' || hostname === 'admin.affiliatemango.com';

    const searchValue = slug || (isLocalhost || isDashboard ? null : hostname);

    const supabase = await createClient();

    if (searchValue && !isGenericPartners) {
        // Try exact match on custom_domain or app_url
        const possibleSlug = searchValue.replace('.affiliatemango.com', '');
        
        const { data: orgByDomain } = await supabase
            .from('organizations')
            .select('id')
            .or(`custom_domain.ilike.${searchValue},app_url.ilike.${searchValue},app_url.ilike.${possibleSlug}`)
            .limit(1);

        if (orgByDomain && orgByDomain.length > 0) return orgByDomain[0].id;
        
        // Fallback match on name
        const { data: orgByName } = await supabase
            .from('organizations')
            .select('id')
            .ilike('name', possibleSlug)
            .limit(1);
            
        if (orgByName && orgByName.length > 0) return orgByName[0].id;
    }

    // Generic portals & Localhost without domain scoping
    // Magically infer the org based on the authenticated affiliate
    if (isGenericPartners || isLocalhost) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            const { data: aff } = await supabase
                .from('affiliates')
                .select('org_id')
                .eq('email', user.email)
                .limit(1);
            if (aff && aff.length > 0) return aff[0].org_id;
        }
    }

    return null;
}
