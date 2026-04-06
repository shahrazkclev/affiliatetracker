const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpfekhoaariwtghswit.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocGZla2hvYWFyaXd0Z2hzd2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDExMDEsImV4cCI6MjA4NzYxNzEwMX0.icr0G-5mhzhqD_99UrHUQELbxRArUkXfyrBO_fs3fw0';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
    const tables = ['organizations', 'campaigns', 'affiliates', 'commissions', 'referrals', 'payouts'];
    console.log('\n=== TABLE CHECK ===');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${table}: MISSING - ${error.message}`);
        } else {
            console.log(`✅ ${table}: exists (${count} rows)`);
        }
    }

    console.log('\n=== AFFILIATE COLUMNS ===');
    const { data: aff } = await supabase.from('affiliates').select('*').limit(1);
    if (aff && aff.length > 0) {
        console.log('Columns:', Object.keys(aff[0]).join(', '));
        console.log('Sample total_commission:', aff[0].total_commission);
        console.log('Has last_synced_at:', 'last_synced_at' in aff[0]);
    }
}

main().catch(console.error);
