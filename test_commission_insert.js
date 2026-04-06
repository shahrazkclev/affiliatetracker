require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSub() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Testing commission insert...');
    
    // 1. Get an existing affiliate and org
    const { data: affiliate } = await supabase.from('affiliates').select('id, org_id').limit(1).single();
    if (!affiliate) return console.log('No affiliate found.');

    // 2. Try inserting $0 commission
    const { error: commErr, data } = await supabase.from('commissions').insert({
        org_id: affiliate.org_id,
        affiliate_id: affiliate.id,
        customer_email: 'test@example.com',
        revenue: 0,
        commission_amount: 0,
        amount: 0,
        stripe_charge_id: 'test_charge_' + Date.now(),
        status: 'pending',
        created_at: new Date().toISOString(),
    }).select();

    if (commErr) {
        console.error('Insert failed:', commErr);
    } else {
        console.log('Insert succeeded:', data);
        
        // Clean up
        await supabase.from('commissions').delete().eq('id', data[0].id);
        console.log('Cleaned up test record.');
    }
}

testSub();
