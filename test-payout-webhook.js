const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(5);
  // find Cleverpoly
  const clever= orgs.find(o => o.name === 'Cleverpoly') || orgs[0];
  
  const { data: affs } = await supabase.from('affiliates').select('id, email, name').eq('org_id', clever.id).limit(1);
  if (!affs || affs.length === 0) {
    console.log("No affiliates found for org", clever.name);
    return;
  }
  const aff = affs[0];
  console.log("Testing payout email for:", aff.email);

  const res = await fetch('https://dashboard.affiliatemango.com/api/webhooks/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table: 'payouts',
      type: 'INSERT',
      record: {
        id: "mock_payout_123",
        affiliate_id: aff.id,
        org_id: clever.id,
        amount: 250.00
      }
    })
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
run();
