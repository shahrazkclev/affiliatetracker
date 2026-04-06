const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpfekhoaariwtghswit.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocGZla2hvYWFyaXd0Z2hzd2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDExMDEsImV4cCI6MjA4NzYxNzEwMX0.icr0G-5mhzhqD_99UrHUQELbxRArUkXfyrBO_fs3fw0';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
    // Check organization columns via a failed insert to see what columns exist
    const { data: orgCols, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
    console.log('Organizations query error:', orgErr?.message || 'none');
    console.log('Organizations data:', orgCols);

    // Check campaigns (no RLS likely)
    const { data: cmp, error: cmpErr } = await supabase
        .from('campaigns')
        .select('id, name, org_id')
        .limit(3);
    console.log('\nCampaigns (3):', JSON.stringify(cmp, null, 2));
    console.log('Campaigns error:', cmpErr?.message || 'none');
    
    // Try to get affiliates without RLS restrictions by count
    const { count: affCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true });
    console.log('\nAffiliate count (via anon):', affCount);
}

main().catch(console.error);
