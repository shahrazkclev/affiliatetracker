'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchAll(endpoint: string, params: Record<string, string> = {}) {
    let allData: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const qs = new URLSearchParams({ ...params, page: String(page), limit: '100' }).toString();
            const res = await fetch(`${BASE_URL}${endpoint}?${qs}`, {
                headers: { "Authorization": `Bearer ${API_KEY}` },
                cache: 'no-store'
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

async function batchUpsert(supabase: any, table: string, rows: any[]) {
    if (!rows.length) return { count: 0, error: null };
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) console.error(`[sync] ${table} error:`, error.message);
    return { count: error ? 0 : rows.length, error };
}

export async function syncPromoteKitData() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        // Get the org — single-tenant setup
        const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)
            .single();
        const orgId = org?.id;
        if (!orgId) return { success: false, error: "No organization found." };

        console.log("[sync] Starting PromoteKit sync for org:", orgId);

        // ── Fetch everything in parallel ──────────────────────────────────────
        const [campaigns, affiliates, commissions, referrals, payouts] = await Promise.all([
            fetchAll("/campaigns"),
            fetchAll("/affiliates"),
            fetchAll("/commissions"),
            fetchAll("/referrals"),
            fetchAll("/payouts"),
        ]);

        console.log(`[sync] Fetched: ${campaigns.length} campaigns, ${affiliates.length} affiliates, ${commissions.length} commissions, ${referrals.length} referrals, ${payouts.length} payouts`);

        // ── 1. CAMPAIGNS ──────────────────────────────────────────────────────
        const campRows = campaigns.map(c => ({
            id: c.id,
            org_id: orgId,
            name: c.name,
            default_commission_percent: c.commission_type === 'percentage' ? c.commission_amount : 0,
            is_default: c.is_default || false,
            created_at: c.created_at
        }));
        await batchUpsert(supabase, 'campaigns', campRows);

        // ── 2. AFFILIATES — with real commission totals ───────────────────────
        const commTotals: Record<string, number> = {};
        const revTotals: Record<string, number> = {};
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
        const { count: affCount } = await batchUpsert(supabase, 'affiliates', affRows);
        console.log(`[sync] Synced ${affCount} affiliates`);

        // ── 3. COMMISSIONS ────────────────────────────────────────────────────
        const commRows = commissions
            .filter((c: any) => c.affiliate?.id)
            .map((c: any) => ({
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
        const { count: commCount, error: commErr } = await batchUpsert(supabase, 'commissions', commRows);
        console.log(`[sync] Synced ${commCount} commissions${commErr ? ` (error: ${commErr.message})` : ''}`);

        // ── 4. REFERRALS ──────────────────────────────────────────────────────
        const refRows = referrals
            .filter((r: any) => r.affiliate?.id)
            .map((r: any) => ({
                id: r.id,
                org_id: orgId,
                affiliate_id: r.affiliate.id,
                customer_email: r.email,
                stripe_customer_id: r.stripe_customer_id || null,
                status: r.subscription_status || 'active',
                created_at: r.created_at || new Date().toISOString()
            }));
        const { count: refCount, error: refErr } = await batchUpsert(supabase, 'referrals', refRows);
        console.log(`[sync] Synced ${refCount} referrals${refErr ? ` (error: ${refErr.message})` : ''}`);

        // ── 5. PAYOUTS ────────────────────────────────────────────────────────
        const payoutRows = payouts
            .filter((p: any) => p.affiliate?.id)
            .map((p: any) => ({
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
        const { count: payoutCount, error: payoutErr } = await batchUpsert(supabase, 'payouts', payoutRows);
        console.log(`[sync] Synced ${payoutCount} payouts${payoutErr ? ` (error: ${payoutErr.message})` : ''}`);

        revalidatePath('/admin');
        revalidatePath('/admin/affiliates');
        revalidatePath('/admin/commissions');
        revalidatePath('/admin/payouts/history');
        revalidatePath('/admin/payouts/generate');

        return {
            success: true,
            counts: {
                campaigns: campRows.length,
                affiliates: affCount,
                commissions: commCount,
                referrals: refCount,
                payouts: payoutCount
            }
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Unknown error occurred" };
    }
}
