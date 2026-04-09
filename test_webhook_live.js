const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: affiliate } = await supabase.from('affiliates').select('id, org_id').limit(1).single();
    if (!affiliate) {
        console.log("No affiliates found.");
        return;
    }

    const payload = {
        type: 'INSERT',
        table: 'payouts',
        record: {
            id: 'mock-uuid',
            affiliate_id: affiliate.id,
            org_id: affiliate.org_id,
            amount: 77.00,
            currency: 'USD'
        }
    };

    console.log("Sending Webhook Payload:", payload);

    try {
        const response = await fetch('https://partners.affiliatemango.com/api/webhooks/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("HTTP error:", e);
    }
}
run();
