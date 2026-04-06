import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function escapeCell(v: unknown): string {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function toRow(cols: unknown[]): string {
    return cols.map(escapeCell).join(',');
}

export async function GET(req: NextRequest) {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status') || 'all';

    // Affiliate ID lookup for search
    let affiliateIds: string[] | null = null;
    if (q) {
        const { data: aff } = await supabase
            .from('affiliates')
            .select('id')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%`);
        affiliateIds = aff?.map((a) => a.id) ?? [];
    }

    let query = supabase
        .from('referrals')
        .select('*, affiliate:affiliates(id, name, email)')
        .order('created_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);

    if (q) {
        const orClauses = [
            `customer_email.ilike.%${q}%`,
            `referred_email.ilike.%${q}%`,
            `stripe_customer_id.ilike.%${q}%`,
        ];
        if (affiliateIds && affiliateIds.length > 0) {
            orClauses.push(`affiliate_id.in.(${affiliateIds.join(',')})`);
        }
        query = query.or(orClauses.join(','));
    }

    const { data: rows } = await query;

    const header = toRow(['Customer Email', 'Referred Email', 'Affiliate Name', 'Affiliate Email', 'Stripe Customer ID', 'Status', 'Date']);
    const lines = (rows ?? []).map((r) => {
        const aff = r.affiliate as any;
        return toRow([
            r.customer_email,
            r.referred_email,
            aff?.name,
            aff?.email,
            r.stripe_customer_id,
            r.status,
            r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
        ]);
    });

    const csv = [header, ...lines].join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="referrals-export-${Date.now()}.csv"`,
        },
    });
}
