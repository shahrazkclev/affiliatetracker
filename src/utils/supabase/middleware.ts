import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const rawHostname = request.headers.get("x-mango-tenant-host") || request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const hostname = rawHostname.split(':')[0].toLowerCase();
    
    const isDashboard = hostname === "dashboard.affiliatemango.com" || hostname === "admin.affiliatemango.com";
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
    const isGenericPartners = hostname === "partners.affiliatemango.com";
    const isMarketingSite = hostname === "affiliatemango.com" || hostname === "www.affiliatemango.com";
    const isTenantDomain = !isDashboard && !isLocalhost && !isGenericPartners && !isMarketingSite;

    let effectivePath = request.nextUrl.pathname;
    
    // Handle the specific partners.affiliatemango.com routing for /slug logic BEFORE auth checks
    if (isGenericPartners) {
        if (effectivePath === '/' || effectivePath === '') {
            // No slug provided on generic domain - this will render an error explicitly downstream 
            // or we could redirect to marketing site. We'll let it route to /portal so it shows 'Organization not found'.
            effectivePath = '/portal';
        } else if (!effectivePath.startsWith('/login') && !effectivePath.startsWith('/register') && !effectivePath.startsWith('/api') && !effectivePath.startsWith('/_next')) {
            // Path looks like /xyzstudio or /xyzstudio/settings
            // We want to rewrite this to /portal or /portal/settings while keeping track of the organization slug.
            const urlParts = effectivePath.split('/').filter(Boolean);
            const slug = urlParts[0]; // e.g., 'xyzstudio'
            const restOfPath = urlParts.slice(1).join('/'); // '' or 'settings'
            
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = restOfPath ? `/portal/${restOfPath}` : '/portal';
            rewriteUrl.searchParams.set('org_slug', slug);
            
            const reqHeaders = new Headers(request.headers);
            reqHeaders.set('x-org-slug', slug);
            
            supabaseResponse = NextResponse.rewrite(rewriteUrl, {
                request: {
                    headers: reqHeaders,
                }
            });
            
            // Adjust effectivePath so the auth checks below know we are entering the portal
            effectivePath = rewriteUrl.pathname;
        }
    } else {
        // Standard behaviors for Dashboard or Custom Domains
        if (effectivePath === '/') {
            if (isTenantDomain) {
                if (user) effectivePath = '/portal';
                else effectivePath = '/apply';
            }
            if (isDashboard) {
                if (user) effectivePath = '/admin';
                else effectivePath = '/login';
            }
        }
    }

    const isAdminRoute = effectivePath.startsWith('/admin')
    const isPortalRoute = effectivePath.startsWith('/portal')

    // If not logged in, redirect to login
    if (!user && (isAdminRoute || isPortalRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If trying to access admin, check they are an org owner and the specific admin email
    if (user && isAdminRoute) {


        const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!org) {
            // Logged in but not an admin — redirect to their affiliate portal
            const url = request.nextUrl.clone()
            url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
