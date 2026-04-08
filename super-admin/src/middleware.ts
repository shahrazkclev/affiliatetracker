import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update request and response cookies
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    
    // Allow static files and APIs securely
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return response;
    }

    if (!user && pathname !== '/login' && !pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && pathname === '/login') {
         return NextResponse.redirect(new URL('/', request.url));
    }

    // Explicit Super Admin authorization check mechanism explicitly verifying emails
    const SUPER_ADMIN_EMAILS = [
        'shahraz@affiliatemango.com', 
        'shahrazkclev@gmail.com', 
        'cgdora4@gmail.com'
    ];

    if (user && !SUPER_ADMIN_EMAILS.includes(user.email ?? '')) {
         // unauthorized — kill session and boot them natively
         await supabase.auth.signOut();
         return NextResponse.redirect(new URL('/login?error=UnauthorizedAccess', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
