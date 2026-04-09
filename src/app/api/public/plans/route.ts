import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the service role key to securely fetch from DB without requiring a user session
// Alternatively, since the table has a public read policy for `is_active=true`, 
// the anon key works just fine.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Fetch active plans ordered by sort_order
        const { data: plans, error } = await supabase
            .from('saas_plans')
            .select(`
                id,
                name,
                price_amount,
                interval,
                features,
                max_affiliates,
                is_popular,
                sort_order
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching plans in public API:', error);
            return NextResponse.json({ error: 'Failed to fetch pricing plans' }, { status: 500 });
        }

        // Add standard CORS headers so you can hit this endpoint from any domain
        return NextResponse.json({ plans }, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (err) {
        console.error('Public Plans API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
