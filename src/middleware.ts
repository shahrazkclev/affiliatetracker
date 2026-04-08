import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request);

    // ── Affiliate attribution via ?via=refCode+sourceTag ──────────────────────
    // IMPORTANT: We read from request.url (raw) so that %2B stays as + before
    // URL decoding happens. We split on + to separate affiliate code from source.
    const rawSearch = request.url.split('?')[1] || '';
    const rawVia = rawSearch
        .split('&')
        .find(p => p.startsWith('via='))
        ?.split('=')[1] ?? null;

    if (rawVia) {
        // Decode %2B → + first, then split on + to get parts
        const decoded = decodeURIComponent(rawVia);          // "fatima+tutorial3"
        const parts = decoded.split('+');
        const affiliateCode = parts[0]?.trim() || '';
        const sourceTag = parts.slice(1).join('+').trim();   // handles multiple + if any

        if (affiliateCode) {
            const nextRes = NextResponse.next({
                request: { headers: request.headers },
            });

            // Copy any cookies already set by updateSession
            response.cookies.getAll().forEach(c => {
                nextRes.cookies.set(c.name, c.value, {
                    httpOnly: c.httpOnly,
                    secure: c.secure,
                    sameSite: c.sameSite as 'lax' | 'strict' | 'none',
                    path: c.path,
                    maxAge: c.maxAge,
                });
            });

            const THIRTY_DAYS = 60 * 60 * 24 * 30;

            // Set affiliate reference cookie — never overwrite if visitor already attributed
            if (!request.cookies.get('_aff_ref')) {
                nextRes.cookies.set('_aff_ref', affiliateCode, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: THIRTY_DAYS,
                    path: '/',
                });
            }

            if (sourceTag) {
                nextRes.cookies.set('_aff_src', sourceTag, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: THIRTY_DAYS,
                    path: '/',
                });
            }

            return nextRes;
        }
    }

    // ── Route Isolation Layer by Hostname ──────────────────────
    const hostname = request.headers.get("x-mango-tenant-host") || request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const pathname = request.nextUrl.pathname;
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
    // We treat anything that isn't localhost and isn't dashboard as a "Tenant/Partner Domain"
    const isDashboard = hostname.startsWith("dashboard.affiliatemango.com") || hostname.startsWith("admin.affiliatemango.com");
    const isTenantDomain = !isDashboard && !isLocalhost;

    if (isTenantDomain) {
        // Tenants (and Custom Domains) CANNOT access /admin
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/portal', request.url));
        }
        // Internally rewrite root to /portal for seamless custom domains
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/portal', request.url));
        }
    } 
    
    if (isDashboard) {
        // Dashboards CANNOT access /portal
        if (pathname.startsWith('/portal')) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        // Internally rewrite root to /admin for snappy admin loading
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/admin', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
