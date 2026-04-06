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

    if (q) {
        const orClauses = [
            `customer_email.ilike.%${q}%`,
            `referred_email.ilike.%${q}%`,
        ];
        if (affiliateIds && affiliateIds.length > 0) {
            orClauses.push(`affiliate_id.in.(${affiliateIds.join(',')})`);
        }
        query = query.or(orClauses.join(','));
    }

    // Fetch commissions too for revenue/commission columns
    const [{ data: rows }, { data: commissions }] = await Promise.all([
        query,
        supabase.from('commissions').select('referral_id, affiliate_id, customer_email, revenue, commission_amount, amount'),
    ]);

    const byId: Record<string, { revenue: number; commission: number }> = {};
    const byKey: Record<string, { revenue: number; commission: number }> = {};
    for (const c of commissions ?? []) {
        const rev = Number(c.revenue || 0);
        const comm = Number(c.commission_amount || c.amount || 0);
        if (c.referral_id) {
            if (!byId[c.referral_id]) byId[c.referral_id] = { revenue: 0, commission: 0 };
            byId[c.referral_id].revenue += rev;
            byId[c.referral_id].commission += comm;
        }
        if (c.customer_email && c.affiliate_id) {
            const key = `${c.affiliate_id}::${c.customer_email.toLowerCase()}`;
            if (!byKey[key]) byKey[key] = { revenue: 0, commission: 0 };
            byKey[key].revenue += rev;
            byKey[key].commission += comm;
        }
    }

    const header = toRow(['Email', 'Affiliate Name', 'Affiliate Email', 'Revenue', 'Commission', 'Status', 'Referral Date']);
    const lines = (rows ?? []).map((r) => {
        const aff = r.affiliate as any;
        const email = (r.customer_email || r.referred_email || '').toLowerCase();
        const totals = byId[r.id] ?? byKey[`${aff?.id}::${email}`] ?? { revenue: 0, commission: 0 };
        return toRow([
            r.customer_email || r.referred_email,
            aff?.name,
            aff?.email,
            totals.revenue.toFixed(2),
            totals.commission.toFixed(2),
            r.status,
            r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
        ]);
    });

    const csv = [header, ...lines].join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="referred-users-export-${Date.now()}.csv"`,
        },
    });
}
