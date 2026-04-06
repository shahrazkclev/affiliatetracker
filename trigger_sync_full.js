const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchAll(endpoint, params = {}) {
    let allData = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const qs = new URLSearchParams({ ...params, page: String(page), limit: '100' }).toString();
            const res = await fetch(`${BASE_URL}${endpoint}?${qs}`, {
                headers: { "Authorization": `Bearer ${API_KEY}` }
            });
            const json = await res.json();
            if (json.data && Array.isArray(json.data)) allData.push(...json.data);
            hasMore = json.pagination?.has_more || false;
            page++;
        } catch {
            hasMore = false;
        }
    }
    return allData;
}

async function batchUpsert(table, rows) {
    if (!rows.length) return { count: 0, error: null };
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) console.error(`[sync] ${table} error:`, error.message);
    return { count: error ? 0 : rows.length, error };
}

async function syncPromoteKitData() {
    try {
        const orgRes = await supabase.from('organizations').select('id').limit(1).single();
        const orgId = orgRes.data?.id;
        if (!orgId) return console.error("No org id");

        const [campaigns, affiliates, commissions, referrals, payouts] = await Promise.all([
            fetchAll("/campaigns"),
            fetchAll("/affiliates"),
            fetchAll("/commissions"),
            fetchAll("/referrals"),
            fetchAll("/payouts"),
        ]);

        console.log(`[sync] Fetched: ${campaigns.length} campaigns, ${affiliates.length} affiliates, ${commissions.length} commissions, ${referrals.length} referrals, ${payouts.length} payouts`);

        const campRows = campaigns.map(c => ({
            id: c.id,
            org_id: orgId,
            name: c.name,
            default_commission_percent: c.commission_type === 'percentage' ? c.commission_amount : 0,
            is_default: c.is_default || false,
            created_at: c.created_at
        }));
        await batchUpsert('campaigns', campRows);

        const commTotals = {};
        const revTotals = {};
        for (const c of commissions) {
            if (c.affiliate?.id) {
                commTotals[c.affiliate.id] = (commTotals[c.affiliate.id] || 0) + (parseFloat(c.commission_amount) || 0);
                revTotals[c.affiliate.id] = (revTotals[c.affiliate.id] || 0) + (parseFloat(c.revenue_amount) || 0);
            }
        }

        const affRows = affiliates.map(a => ({
            id: a.id,
            org_id: orgId,
            campaign_id: a.campaign?.id || null,
            name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
            email: a.email,
            payout_email: a.payout_email || a.email,
            referral_code: a.links?.length > 0 ? a.links[0].code : `ref_${a.id.substring(0, 6)}`,
            status: a.approved ? 'active' : 'pending',
            clicks: a.clicks || 0,
            total_commission: Math.round((commTotals[a.id] || 0) * 100) / 100,
            total_revenue: Math.round((revTotals[a.id] || 0) * 100) / 100,
            created_at: a.created_at,
        }));
        const { count: affCount } = await batchUpsert('affiliates', affRows);
        console.log(`[sync] Synced ${affCount} affiliates`);

        const commRows = commissions
            .filter(c => c.affiliate?.id)
            .map(c => ({
                id: c.id,
                org_id: orgId,
                affiliate_id: c.affiliate.id,
                referral_id: c.referral?.id || null,
                customer_email: c.referral?.email || c.customer_email || null,
                revenue: parseFloat(c.revenue_amount) || 0,
                commission_amount: parseFloat(c.commission_amount) || 0,
                amount: parseFloat(c.commission_amount) || 0,
                stripe_charge_id: c.stripe_payment_id || null,
                status: c.status || 'pending',
                created_at: c.created_at || new Date().toISOString()
            }));
        const { count: commCount, error: commErr } = await batchUpsert('commissions', commRows);
        console.log(`[sync] Synced ${commCount} commissions${commErr ? ` (error: ${commErr.message})` : ''}`);

        const refRows = referrals
            .filter(r => r.affiliate?.id)
            .map(r => ({
                id: r.id,
                org_id: orgId,
                affiliate_id: r.affiliate.id,
                customer_email: r.email,
                stripe_customer_id: r.stripe_customer_id || null,
                status: r.subscription_status || 'active',
                created_at: r.created_at || new Date().toISOString()
            }));
        const { count: refCount, error: refErr } = await batchUpsert('referrals', refRows);
        console.log(`[sync] Synced ${refCount} referrals${refErr ? ` (error: ${refErr.message})` : ''}`);

        const payoutRows = payouts
            .filter(p => p.affiliate?.id)
            .map(p => ({
                id: p.id,
                org_id: orgId,
                affiliate_id: p.affiliate.id,
                amount: parseFloat(p.amount) || 0,
                currency: p.currency || 'USD',
                notes: `Payout — ${p.affiliate_name || p.affiliate.email}`,
                period: p.period || null,
                payment_count: p.payment_count || 1,
                created_at: p.created_at || new Date().toISOString()
            }));
        const { count: payoutCount, error: payoutErr } = await batchUpsert('payouts', payoutRows);
        console.log(`[sync] Synced ${payoutCount} payouts${payoutErr ? ` (error: ${payoutErr.message})` : ''}`);

    } catch (e) {
        console.error("Unknown error occurred", e);
    }
}
syncPromoteKitData();
