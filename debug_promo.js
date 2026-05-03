require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Find the affiliate with cgmathv99@gmail.com
  const { data: aff, error: affErr } = await supabase
    .from('affiliates')
    .select('id, email, stripe_promo_code, stripe_promo_id, org_id, campaign_id, referral_code, total_commission')
    .eq('email', 'cgmathv99@gmail.com');
  console.log('=== AFFILIATE RECORD ===');
  console.log(JSON.stringify(aff, null, 2));
  if (affErr) console.log('Affiliate error:', affErr);

  if (!aff || aff.length === 0) {
    console.log('No affiliate found with cgmathv99@gmail.com');
    return;
  }

  const orgId = aff[0].org_id;

  // 2. Get the org's stripe key
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, stripe_secret_key, stripe_webhook_secret')
    .eq('id', orgId)
    .single();
  console.log('\n=== ORGANIZATION ===');
  console.log('ID:', org?.id);
  console.log('Name:', org?.name);
  console.log('Has Stripe Key:', !!org?.stripe_secret_key);
  console.log('Has Webhook Secret:', !!org?.stripe_webhook_secret);

  if (!org?.stripe_secret_key) {
    console.log('NO STRIPE KEY ON ORG — this is the problem');
    return;
  }

  // 3. Get the latest checkout sessions from Stripe
  const stripe = new Stripe(org.stripe_secret_key);
  
  // Check the latest events
  const events = await stripe.events.list({ type: 'checkout.session.completed', limit: 5 });
  console.log('\n=== LATEST CHECKOUT EVENTS ===');
  for (const ev of events.data) {
    const sess = ev.data.object;
    console.log('\n--- Event:', ev.id, '---');
    console.log('Created:', new Date(ev.created * 1000).toISOString());
    console.log('Session ID:', sess.id);
    console.log('client_reference_id:', sess.client_reference_id);
    console.log('amount_total:', sess.amount_total);
    console.log('customer_email:', sess.customer_details?.email || sess.customer_email);
    console.log('discounts (raw):', JSON.stringify(sess.discounts));
    console.log('total_details.amount_discount:', sess.total_details?.amount_discount);
    console.log('total_details.breakdown.discounts:', JSON.stringify(sess.total_details?.breakdown?.discounts));
    
    // Try to expand the session
    try {
      const expanded = await stripe.checkout.sessions.retrieve(sess.id, {
        expand: ['total_details.breakdown.discounts.discount.promotion_code', 'discounts', 'discounts.promotion_code']
      });
      console.log('EXPANDED discounts:', JSON.stringify(expanded.discounts, null, 2));
      console.log('EXPANDED breakdown:', JSON.stringify(expanded.total_details?.breakdown?.discounts, null, 2));
    } catch(e) {
      console.log('Expand error:', e.message);
    }
  }

  // 4. Also check if the promo code resolves
  if (aff[0].stripe_promo_id) {
    try {
      const promo = await stripe.promotionCodes.retrieve(aff[0].stripe_promo_id);
      console.log('\n=== PROMO CODE FROM STRIPE ===');
      console.log('ID:', promo.id);
      console.log('Code:', promo.code);
      console.log('Coupon ID:', promo.coupon?.id);
      console.log('Active:', promo.active);
    } catch(e) {
      console.log('\nFailed to retrieve promo by stripe_promo_id:', e.message);
    }
  }

  // 5. Check existing commissions/referrals for this affiliate
  const { data: comms } = await supabase
    .from('commissions')
    .select('*')
    .eq('affiliate_id', aff[0].id)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('\n=== RECENT COMMISSIONS ===');
  console.log(JSON.stringify(comms, null, 2));

  const { data: refs } = await supabase
    .from('referrals')
    .select('*')
    .eq('affiliate_id', aff[0].id)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('\n=== RECENT REFERRALS ===');
  console.log(JSON.stringify(refs, null, 2));
}

run().catch(e => console.error(e));
