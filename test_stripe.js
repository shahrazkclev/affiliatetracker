require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe');
const SUPABASE_URL = "https://ahpfekhoaariwtghswit.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: orgs } = await supabase.from('organizations').select('id, stripe_secret_key');
  const org = orgs.find(o => o.stripe_secret_key);
  if (!org) return console.log("No org with stripe key");
  
  const s = stripe(org.stripe_secret_key);
  const events = await s.events.list({ type: 'checkout.session.completed', limit: 3 });
  for (const ev of events.data) {
    console.log("Session ID:", ev.data.object.id);
    console.log("Amount Total:", ev.data.object.amount_total);
    console.log("Discounts:", JSON.stringify(ev.data.object.total_details?.breakdown?.discounts || ev.data.object.discounts));
  }
}
run();
