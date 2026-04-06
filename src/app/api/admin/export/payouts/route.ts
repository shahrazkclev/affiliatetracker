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

    let affiliateIdFilter: string[] | null = null;
    if (q) {
        const { data: matched } = await supabase
            .from('affiliates')
            .select('id')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%`);
        affiliateIdFilter = (matched || []).map((a) => a.id);
    }

    let query = supabase
        .from('payouts')
        .select('id, amount, currency, notes, created_at, period, affiliate_id, affiliate:affiliates(name, email, payout_email)')
        .order('created_at', { ascending: false });

    if (q) {
        const conditions: string[] = [`notes.ilike.%${q}%`];
        if (affiliateIdFilter && affiliateIdFilter.length > 0) {
            conditions.push(`affiliate_id.in.(${affiliateIdFilter.join(',')})`);
        }
        query = query.or(conditions.join(','));
    }

    const { data: rows } = await query;

    const header = toRow(['Affiliate Name', 'Affiliate Email', 'Payout Email', 'Amount', 'Currency', 'Period', 'Notes', 'Date']);
    const lines = (rows ?? []).map((p) => {
        const aff = p.affiliate as any;
        return toRow([
            aff?.name,
            aff?.email,
            aff?.payout_email,
            Number(p.amount || 0).toFixed(2),
            p.currency || 'USD',
            p.period,
            p.notes,
            p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '',
        ]);
    });

    const csv = [header, ...lines].join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="payouts-export-${Date.now()}.csv"`,
        },
    });
}
