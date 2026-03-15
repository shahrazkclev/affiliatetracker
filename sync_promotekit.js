require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";
const BASE_URL = "https://www.promotekit.com/api/v1";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchAll(endpoint) {
    let allData = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching ${endpoint} (Page ${page})...`);
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
            console.error(`Failed to fetch ${endpoint} page ${page}:`, e);
            hasMore = false;
        }
    }
    return allData;
}

async function run() {
    console.log("Starting full data sync from PromoteKit...");

    // 1. Fetch campaigns, affiliates, and commissions
    const campaigns = await fetchAll("/campaigns");
    const affiliates = await fetchAll("/affiliates");
    const commissions = await fetchAll("/commissions");

    console.log(`Fetched ${campaigns.length} campaigns, ${affiliates.length} affiliates, ${commissions.length} commissions.`);

    // Match org_id to cgdora4@gmail.com
    const { data: userOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', "cgdora4's Organization")
        .single();

    let orgId = userOrg?.id;

    if (!orgId) {
        // Fallback to first org
        const { data: fallback } = await supabase.from('organizations').select('id').limit(1).single();
        orgId = fallback?.id;
    }

    if (!orgId) {
        console.log("No organization found. Creating 'PromoteKit Org'...");
        const { data: newOrg, error } = await supabase.from('organizations').insert({ name: 'PromoteKit Org' }).select().single();
        if (error) {
            console.error("Creation failed", error);
            return;
        }
        orgId = newOrg.id;
    }

    console.log(`Using Org ID: ${orgId}`);

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
    console.log("Upserted Campaigns.");

    // Calculate total commissions per affiliate
    const commissionTotals = {};
    for (const comm of commissions) {
        if (comm.affiliate && comm.affiliate.id) {
            const afId = comm.affiliate.id;
            const amount = parseFloat(comm.amount) || 0;
            commissionTotals[afId] = (commissionTotals[afId] || 0) + amount;
        }
    }

    // Insert Affiliates
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
            created_at: a.created_at
        }, { onConflict: 'id' });
    }
    console.log("Upserted Affiliates.");
    console.log("Sync Complete.");
}

run().catch(console.error);
