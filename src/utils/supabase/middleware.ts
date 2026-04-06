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

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')

    // If not logged in, redirect to login
    if (!user && (isAdminRoute || isPortalRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If trying to access admin, check they are an org owner and the specific admin email
    if (user && isAdminRoute) {
        if (user.email !== 'cgdora4@gmail.com') {
            const url = request.nextUrl.clone()
            url.pathname = '/portal'
            return NextResponse.redirect(url)
        }

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
