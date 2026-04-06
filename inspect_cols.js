// Inspect actual column names in each table
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ahpfekhoaariwtghswit.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocGZla2hvYWFyaXd0Z2hzd2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDExMDEsImV4cCI6MjA4NzYxNzEwMX0.icr0G-5mhzhqD_99UrHUQELbxRArUkXfyrBO_fs3fw0';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function cols(table) {
    // showMissing trick to get column shape even with empty/RLS tables
    const { data, error } = await supabase.from(table).select('*').limit(0);
    // Try an insert with a fake row to get column info from the error
    const { error: insertErr } = await supabase.from(table).insert({ _fake: true });
    console.log(`\n${table}:`);
    console.log('  select error:', error?.message || 'none');
    console.log('  insert error:', insertErr?.message || 'none');
}

async function main() {
    await cols('commissions');
    await cols('referrals');
    await cols('payouts');
    await cols('affiliates');
    
    // Also try to read one commission row to see column names
    const { data: aff } = await supabase.from('affiliates').select('*').limit(1);
    if (aff?.length) console.log('\nAffiliate cols:', Object.keys(aff[0]));
    
    const { data: comm } = await supabase.from('commissions').select('*').limit(1);
    if (comm?.length) console.log('\nCommission cols:', Object.keys(comm[0]));
    else console.log('\ncommissions: empty or RLS blocked');
    
    const { data: ref } = await supabase.from('referrals').select('*').limit(1);
    if (ref?.length) console.log('\nReferral cols:', Object.keys(ref[0]));
    else console.log('\nreferrals: empty or RLS blocked');
    
    const { data: pay } = await supabase.from('payouts').select('*').limit(1);
    if (pay?.length) console.log('\nPayout cols:', Object.keys(pay[0]));
    else console.log('\npayouts: empty or RLS blocked');
}
main().catch(console.error);
