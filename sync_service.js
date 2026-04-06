/**
 * sync_service.js — Full sync using service role key (bypasses RLS)
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpfekhoaariwtghswit.supabase.co';
const SERVICE_KEY = 'YOUR_SERVICE_KEY';
const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://www.promotekit.com/api/v1';
const ORG_ID = '8bdc6202-f1ec-436d-ada4-4b9462a44f85';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fetchAll(endpoint) {
    let all = [];
    let page = 1;
    process.stdout.write(`Fetching ${endpoint}`);
    while (true) {
        process.stdout.write('.');
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 20000);
        try {
            const res = await fetch(`${BASE_URL}${endpoint}?page=${page}&limit=100`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` },
                signal: controller.signal
            });
            clearTimeout(t);
            const json = await res.json();
            if (json.data?.length) all.push(...json.data);
            if (!json.pagination?.has_more) break;
            page++;
        } catch (e) {
            clearTimeout(t);
            console.log(` TIMEOUT/ERR at page ${page}: ${e.message}`);
            break;
        }
    }
    console.log(` → ${all.length}`);
    return all;
}

async function upsert(table, rows) {
    if (!rows.length) { console.log(`  ${table}: 0 rows`); return 0; }
    let done = 0;
    for (let i = 0; i < rows.length; i += 50) {
        const { error } = await supabase.from(table).upsert(rows.slice(i, i + 50), { onConflict: 'id' });
        if (error) {
            console.error(`  ❌ ${table}[${i}]: ${error.message}`);
            console.error(`     Row sample:`, JSON.stringify(rows[i]));
            return done;
        }
        done += Math.min(50, rows.length - i);
    }
    console.log(`  ✅ ${table}: ${done} rows`);
    return done;
}

async function main() {
    console.log('🚀 Full sync (service role)\n');

    // 1. Campaigns
    const camps = await fetchAll('/campaigns');
    await upsert('campaigns', camps.map(c => ({
        id: c.id, org_id: ORG_ID, name: c.name,
        default_commission_percent: c.commission_type === 'percentage' ? c.commission_amount : 0,
        is_default: c.is_default || false, created_at: c.created_at
    })));

    // 2. Affiliates + commissions (need commissions first for totals)
    const affiliates = await fetchAll('/affiliates');
    const commissions = await fetchAll('/commissions');

    // Real per-affiliate totals
    const totals = {};
    for (const c of commissions) {
        if (c.affiliate?.id) {
            totals[c.affiliate.id] = (totals[c.affiliate.id] || 0) + (parseFloat(c.commission_amount) || 0);
        }
    }

    console.log('\nCommission totals:');
    affiliates.forEach(a => {
        const t = totals[a.id] || 0;
        if (t > 0) console.log(`  ${a.email}: $${t.toFixed(2)}`);
    });
    console.log();

    await upsert('affiliates', affiliates.map(a => ({
        id: a.id, org_id: ORG_ID,
        campaign_id: a.campaign?.id || null,
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
        email: a.email,
        payout_email: a.payout_email || a.email,
        referral_code: a.links?.length > 0 ? a.links[0].code : `ref_${a.id.substring(0, 6)}`,
        status: a.approved ? 'active' : 'pending',
        clicks: a.clicks || 0,
        total_commission: Math.round((totals[a.id] || 0) * 100) / 100,
        created_at: a.created_at
    })));

    await upsert('commissions', commissions.filter(c => c.affiliate?.id).map(c => ({
        id: c.id, org_id: ORG_ID,
        affiliate_id: c.affiliate.id,
        amount: parseFloat(c.commission_amount) || 0,
        status: c.status || 'pending',
        created_at: c.created_at || new Date().toISOString()
    })));

    // 3. Referrals
    const referrals = await fetchAll('/referrals');
    await upsert('referrals', referrals.filter(r => r.affiliate?.id).map(r => ({
        id: r.id, org_id: ORG_ID,
        affiliate_id: r.affiliate.id,
        referred_email: r.email,
        status: r.subscription_status || 'active',
        created_at: r.created_at || new Date().toISOString()
    })));

    // 4. Payouts
    const payouts = await fetchAll('/payouts');
    await upsert('payouts', payouts.filter(p => p.affiliate?.id).map(p => ({
        id: p.id, org_id: ORG_ID,
        affiliate_id: p.affiliate.id,
        amount: parseFloat(p.amount) || 0,
        currency: p.currency || 'USD',
        notes: `${p.affiliate_name || p.affiliate.email}`,
        period: p.period || null,
        payment_count: p.payment_count || 1,
        created_at: p.created_at || new Date().toISOString()
    })));

    // Final counts
    console.log('\n📊 Final counts:');
    for (const t of ['campaigns','affiliates','commissions','referrals','payouts']) {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`  ${t}: ${count}`);
    }
    console.log('\n✅ Done!');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
