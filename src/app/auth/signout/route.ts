import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/request';

export async function POST(req: NextRequest) {
    const supabase = createClient();
    
    // Check if a user's logged in
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        await supabase.auth.signOut();
    }

    revalidatePath('/', 'layout');
    
    // Build the URL to redirect to the login page
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    
    // Make sure we carry over no extra auth params
    url.search = '';

    return NextResponse.redirect(url, {
        status: 302,
    });
}
