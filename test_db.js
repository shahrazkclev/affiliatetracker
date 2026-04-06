const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function check() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: comms, error: commsErr } = await supabase.from('commissions').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Commissions:', comms);
  const { data: refs, error: refsErr } = await supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Referrals:', refs);
  process.exit(0);
}
check();
