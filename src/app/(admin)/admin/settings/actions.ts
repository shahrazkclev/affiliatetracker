'use server';

import { createClient } from "@/utils/supabase/server";

const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchAll(endpoint: string) {
    let allData: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}?page=${page}&limit=50`, {
                headers: { "Authorization": `Bearer ${API_KEY}` }
            });
            const json = await res.json();
            if (json.data && Array.isArray(json.data)) {
                allData.push(...json.data);
            }
            hasMore = json.pagination?.has_more || false;
            page++;
        } catch (e) {
            hasMore = false;
        }
    }
    return allData;
}

export async function syncPromoteKitData() {
    try {
        const supabase = await createClient();

        // Check if admin is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        let orgId = null;

        // Get admin's org
        const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single();
        orgId = org?.id;

        if (!orgId) {
            // Try to create one since it might be missing
            const { data: newOrg, error: newOrgErr } = await supabase.from('organizations').insert({
                name: 'Cleverpoly Network',
                owner_id: user.id
            }).select().single();
            orgId = newOrg?.id;
        }

        if (!orgId) return { success: false, error: "Failed to resolve organization." };

        console.log("Starting PromoteKit sync for org:", orgId);

        const campaigns = await fetchAll("/campaigns");
        const affiliates = await fetchAll("/affiliates");
        const commissions = await fetchAll("/commissions");

        // Insert Campaigns
        for (const c of campaigns) {
            const pct = c.commission_type === 'percentage' ? c.commission_amount : 0;
            await supabase.from('campaigns').upsert({
                id: c.id,
                org_id: orgId,
                name: c.name,
                default_commission_percent: pct,
                is_default: c.is_default || false,
                created_at: c.created_at
            }, { onConflict: 'id' });
        }

        // Calculate commissions
        const commissionTotals: Record<string, number> = {};
        for (const comm of commissions) {
            if (comm.affiliate && comm.affiliate.id) {
                const afId = comm.affiliate.id;
                const amount = parseFloat(comm.amount) || 0;
                commissionTotals[afId] = (commissionTotals[afId] || 0) + amount;
            }
        }

        // Insert Affiliates and sync last_synced_at
        for (const a of affiliates) {
            const name = `${a.first_name || ''} ${a.last_name || ''}`.trim();
            const code = a.links && a.links.length > 0 ? a.links[0].code : `ref_${a.id.substring(0, 6)}`;
            const totalComm = commissionTotals[a.id] || 0;

            await supabase.from('affiliates').upsert({
                id: a.id,
                org_id: orgId,
                campaign_id: a.campaign?.id || null,
                name: name,
                email: a.email,
                payout_email: a.payout_email || a.email,
                referral_code: code,
                status: a.approved ? 'active' : 'pending',
                clicks: a.clicks || 0,
                total_commission: totalComm,
                created_at: a.created_at,
                last_synced_at: new Date().toISOString()
            }, { onConflict: 'id' });
        }

        // Insert individual Commissions
        for (const comm of commissions) {
            if (comm.affiliate && comm.affiliate.id) {
                await supabase.from('commissions').upsert({
                    id: comm.id,
                    org_id: orgId,
                    affiliate_id: comm.affiliate.id,
                    amount: parseFloat(comm.amount) || 0,
                    status: 'pending', // PromoteKit uses various statuses; default to pending
                    created_at: comm.created_at || new Date().toISOString()
                }, { onConflict: 'id' });
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Unknown error occurred" };
    }
}
