/**
 * sync_missing.js — Sync commissions + referrals with correct column names
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpfekhoaariwtghswit.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocGZla2hvYWFyaXd0Z2hzd2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA0MTEwMSwiZXhwIjoyMDg3NjE3MTAxfQ.HO5BVCCt_ZaCIAcKUnRlVPhHcXXdY4XCtw2RJ5wLhhQ';
const API_KEY = 'pk_7fgiE9xvZRZiQusxvYujJM';
const BASE_URL = 'https://www.promotekit.com/api/v1';
const ORG_ID = '8bdc6202-f1ec-436d-ada4-4b9462a44f85';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fetchAll(endpoint) {
    let all = [];
    let page = 1;
    process.stdout.write(`Fetching ${endpoint}`);
    while (true) {
        process.stdout.write('.');
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        try {
            const res = await fetch(`${BASE_URL}${endpoint}?page=${page}&limit=100`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` },
                signal: ctrl.signal
            });
            clearTimeout(t);
            const json = await res.json();
            if (json.data?.length) all.push(...json.data);
            if (!json.pagination?.has_more) break;
            page++;
        } catch (e) { clearTimeout(t); console.log(` ERR: ${e.message}`); break; }
    }
    console.log(` → ${all.length}`);
    return all;
}

async function upsert(table, rows) {
    if (!rows.length) return;
    let done = 0;
    for (let i = 0; i < rows.length; i += 50) {
        const { error } = await supabase.from(table).upsert(rows.slice(i, i + 50), { onConflict: 'id' });
        if (error) {
            console.error(`❌ ${table}[${i}]: ${error.message}`);
            console.error(`   Sample:`, JSON.stringify(rows[i]));
            return;
        }
        done += Math.min(50, rows.length - i);
    }
    console.log(`✅ ${table}: ${done} rows`);
}

async function main() {
    // First, check actual columns in commissions and referrals
    const { data: commSample } = await supabase.from('commissions').select('*').limit(1);
    if (commSample?.length) {
        console.log('Commission columns:', Object.keys(commSample[0]).join(', '));
    } else {
        // Table is empty — try insert with minimal required fields to discover schema
        const { error } = await supabase.from('commissions').insert({ id: 'test', affiliate_id: 'test' });
        console.log('Commissions insert test:', error?.message);
    }
    
    const { data: refSample } = await supabase.from('referrals').select('*').limit(1);
    if (refSample?.length) {
        console.log('Referral columns:', Object.keys(refSample[0]).join(', '));
    } else {
        const { error } = await supabase.from('referrals').insert({ id: 'test', affiliate_id: 'test' });
        console.log('Referrals insert test:', error?.message);
    }

    // Fetch from PromoteKit
    const commissions = await fetchAll('/commissions');
    const referrals = await fetchAll('/referrals');

    // Commissions — exact column names from DB schema:
    // revenue (NOT NULL), commission_amount (NOT NULL), stripe_charge_id (nullable)
    await upsert('commissions', commissions.filter(c => c.affiliate?.id).map(c => ({
        id: c.id,
        org_id: ORG_ID,
        affiliate_id: c.affiliate.id,
        revenue: parseFloat(c.revenue_amount) || 0,           // revenue_amount from PromoteKit
        commission_amount: parseFloat(c.commission_amount) || 0, // commission earned
        amount: parseFloat(c.commission_amount) || 0,          // our added column (alias)
        stripe_charge_id: c.stripe_payment_id || null,
        status: c.status || 'pending',
        created_at: c.created_at || new Date().toISOString()
    })));

    // Referrals — customer_email is the real column (now nullable after SQL fix)
    await upsert('referrals', referrals.filter(r => r.affiliate?.id).map(r => ({
        id: r.id,
        org_id: ORG_ID,
        affiliate_id: r.affiliate.id,
        customer_email: r.email,
        stripe_customer_id: r.stripe_customer_id || null,
        status: r.subscription_status || 'active',
        created_at: r.created_at || new Date().toISOString()
    })));

    // Final counts
    console.log('\n📊 Final counts:');
    for (const t of ['campaigns','affiliates','commissions','referrals','payouts']) {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`  ${t}: ${count}`);
    }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
