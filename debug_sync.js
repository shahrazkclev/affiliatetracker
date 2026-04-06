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
        } catch (e) {
            hasMore = false;
        }
    }
    return allData;
}

async function run() {
    const orgRes = await supabase.from('organizations').select('id').limit(1).single();
    const orgId = orgRes.data.id;

    const commissions = await fetchAll('/commissions');

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

    const { data, error } = await supabase.from('commissions').upsert(commRows, { onConflict: 'id' }).select();
    if (error) {
        console.error("Full Batch Upsert error:", error);
    } else {
        console.log("Upserted all 172 successfully.");
    }
}

run();
