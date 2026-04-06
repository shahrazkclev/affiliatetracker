import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// This API route ensures Supabase is pinged so it does not auto-pause 
// the free-tier project due to inactivity.

export async function GET() {
    try {
        const supabase = await createClient();
        // Ping the database with a lightweight query
        const { count, error } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('[KeepAlive] Database ping failed:', error.message);
            return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
        }

        console.log(`[KeepAlive] Database ping successful. Organizations count: ${count}`);
        return NextResponse.json({ status: 'success', timestamp: new Date().toISOString() });
    } catch (e: any) {
        return NextResponse.json({ status: 'error', message: e.message || 'Unknown error' }, { status: 500 });
    }
}
