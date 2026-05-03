require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Get the affiliate
  const { data: aff } = await supabase
    .from('affiliates')
    .select('id, email, stripe_promo_code, stripe_promo_id, org_id')
    .eq('email', 'cgmathv99@gmail.com')
    .single();

  console.log('DB stripe_promo_code:', JSON.stringify(aff.stripe_promo_code));
  console.log('DB stripe_promo_id:', JSON.stringify(aff.stripe_promo_id));

  // Get the org stripe key
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_secret_key')
    .eq('id', aff.org_id)
    .single();

  const stripe = new Stripe(org.stripe_secret_key);

  // Get the most recent checkout that used the promo
  const latestEvent = (await stripe.events.list({ type: 'checkout.session.completed', limit: 1 })).data[0];
  const sess = latestEvent.data.object;
  const promoId = sess.discounts?.[0]?.promotion_code;

  console.log('\nLatest checkout promo ID:', promoId);

  if (promoId) {
    const promo = await stripe.promotionCodes.retrieve(promoId);
    console.log('Stripe promo code text:', promo.code);
    console.log('Stripe coupon ID:', promo.coupon?.id);
    
    // Simulate the exact query the webhook would now run
    const queryStr = `stripe_promo_code.ilike.${promo.code},stripe_promo_id.eq.${promoId}${promo.coupon?.id ? `,stripe_promo_id.eq.${promo.coupon.id}` : ''}`;
    console.log('\nQuery .or():', queryStr);
    
    const { data: match, error } = await supabase
      .from('affiliates')
      .select('id, email, stripe_promo_code, stripe_promo_id')
      .eq('org_id', aff.org_id)
      .or(queryStr)
      .maybeSingle();
    
    console.log('Match result:', JSON.stringify(match));
    if (error) console.log('Match error:', error);
  }
}
run().catch(console.error);
