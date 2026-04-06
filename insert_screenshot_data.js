require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: affiliates, error } = await supabase.from('affiliates').select('id, name, email');
  if (error) { console.error(error); return; }
  console.log("Found affiliates:", affiliates.length);
  
  const affiliateMap = {};
  for (const a of affiliates) {
    affiliateMap[a.name.toLowerCase().trim()] = a.id;
  }
  console.log("Affiliate Name -> ID map created.");
  
  const referralsToAdd = [
    { email: "fethiseladji11@gmail.com", affiliateName: "abdul ahad", rev: 99.0, comm: 29.70, date: "2026-04-03" },
    { email: "jeetqt@gmail.com", affiliateName: "not your skills video", rev: 99.0, comm: 29.70, date: "2026-04-02" },
    { email: "mahertrend260@gmail.com", affiliateName: "zaid ali", rev: 89.1, comm: 26.73, date: "2026-03-30" },
    { email: "jjjdeocariza@gmail.com", affiliateName: "fatima sultan", rev: 74.25, comm: 29.70, date: "2026-03-24" },
    { email: "birdwrk86@gmail.com", affiliateName: "fatima sultan", rev: 84.15, comm: 33.66, date: "2026-03-10" }
  ];

  for (const r of referralsToAdd) {
    const affId = affiliateMap[r.affiliateName.toLowerCase()];
    if (!affId) {
       console.log("MISSING AFFILIATE FOR", r.affiliateName);
       continue;
    }
    // Check if referral exists
    const { data: existingRef } = await supabase.from('referrals').select('id').eq('customer_email', r.email).single();
    let refId;
    if (!existingRef) {
      const { data: insertedRef, error: ie } = await supabase.from('referrals').insert({
        affiliate_id: affId,
        customer_email: r.email,
        referred_email: r.email,
        status: 'active',
        created_at: new Date(r.date).toISOString()
      }).select('id').single();
      if (ie) console.log("Insert ref error", ie);
      else { refId = insertedRef.id; console.log("Inserted referral for", r.email); }
    } else {
      refId = existingRef.id;
      console.log("Referral exists for", r.email);
    }
    
    if (refId) {
      // Upsert commission
      const { data: existingComm } = await supabase.from('commissions').select('id').eq('referral_id', refId).single();
      if (!existingComm) {
        const { error: ce } = await supabase.from('commissions').insert({
          affiliate_id: affId,
          referral_id: refId,
          customer_email: r.email,
          revenue: r.rev,
          amount: r.comm,
          status: 'pending',
          created_at: new Date(r.date).toISOString()
        });
        if (ce) console.log("Insert comm error", ce);
        else console.log("Inserted commission for", r.email);
      }
    }
  }

  // Payouts
  const { data: existingPayouts, error: pError } = await supabase.from('payouts').select('id').limit(1);
  if (pError) console.log("Payouts table might not exist or error:", pError.message);
  else console.log("Payouts table exists");
}

main();
