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
    const hostname = h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "";
    
    // For localhost dev, default to null if no explicit slug mapping to avoid hijacking the routing
    const searchValue = slug || (hostname.includes('localhost') ? null : hostname);

    if (!searchValue) return null;

    const supabase = await createClient();
    const { data } = await supabase
        .from('organizations')
        .select('id')
        .ilike('custom_domain', searchValue)
        .limit(1)
        .maybeSingle();

    return data?.id || null;
}
