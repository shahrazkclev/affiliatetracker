require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: refs } = await supabase.from('referrals').select('customer_email').limit(5);
  console.log("Refs:", refs);
  const { data: comms } = await supabase.from('commissions').select('customer_email, commission_amount').limit(5);
  console.log("Comms:", comms);
  const { data: payouts } = await supabase.from('payouts').select('id, amount').limit(5);
  console.log("Payouts:", payouts);
}
run();
