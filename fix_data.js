require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: affiliates, error } = await supabase.from('affiliates').select('id, name, email');
  if (error) { console.error(error); return; }
  
  const affiliateMap = {};
  for (const a of affiliates) {
    affiliateMap[a.name.toLowerCase().trim()] = a.id;
  }
  
  const referralsToAdd = [
    { email: "fethiseladji11@gmail.com", affiliateName: "abdul ahad", rev: 99.0, comm: 29.70, date: "2026-04-03" },
    { email: "jeetqt@gmail.com", affiliateName: "not your skills video", rev: 99.0, comm: 29.70, date: "2026-04-02" },
    { email: "mahertrend260@gmail.com", affiliateName: "zaid ali", rev: 89.1, comm: 26.73, date: "2026-03-30" },
    { email: "jjjdeocariza@gmail.com", affiliateName: "fatima sultan", rev: 74.25, comm: 29.70, date: "2026-03-24" },
    { email: "birdwrk86@gmail.com", affiliateName: "fatima sultan", rev: 84.15, comm: 33.66, date: "2026-03-10" }
  ];

  for (const r of referralsToAdd) {
    const affId = affiliateMap[r.affiliateName.toLowerCase()];
    if (!affId) continue;
    
    // Check if referral exists
    const { data: existingRef } = await supabase.from('referrals').select('id').eq('customer_email', r.email).single();
    if (existingRef) {
      // Upsert commission
      const { data: existingComm } = await supabase.from('commissions').select('id').eq('referral_id', existingRef.id).single();
      if (!existingComm) {
        const { error: ce } = await supabase.from('commissions').insert({
          affiliate_id: affId,
          referral_id: existingRef.id,
          customer_email: r.email,
          revenue: r.rev,
          commission_amount: r.comm, // FIX column name
          amount: r.comm,
          status: 'approved', // make them approved since they appear tracked
          created_at: new Date(r.date).toISOString()
        });
        if (ce) console.log("Insert comm error", ce);
        else console.log("Inserted commission for", r.email);
      }
    }
  }

  const payoutsToAdd = [
    { name: "Ahmad ali", amt: 185.13, date: "2026-04-29" },
    { name: "Zaid Ali", amt: 128.81, date: "2026-04-29" },
    { name: "chap1 course", amt: 29.75, date: "2026-04-29" },
    { name: "not your skills video", amt: 29.70, date: "2026-04-29" },
    { name: "fix portfolio", amt: 29.15, date: "2026-04-29" },
    { name: "Creative Sav", amt: 20.85, date: "2026-04-29" },
    { name: "Levar Boutte", amt: 15.29, date: "2026-04-29" },
    { name: "Angela Ryu", amt: 13.76, date: "2026-04-29" },
    { name: "Maniha Tahir", amt: 7.50, date: "2026-04-29" },
    { name: "Haadi Mohammed", amt: 3.60, date: "2026-04-29" },
    { name: "Haris Khan", amt: 2.40, date: "2026-04-29" },
    { name: "Abdul Ahad", amt: 29.70, date: "2026-04-29" },
    { name: "Andy M", amt: 99.38, date: "2026-04-29" },
    { name: "Fatima Sultan", amt: 63.36, date: "2026-04-29" },
    { name: "Fatima Sultan", amt: 39.60, date: "2026-02-27" },
    { name: "Fatima Sultan", amt: 59.40, date: "2026-01-30" },
    { name: "Abdul Ahad", amt: 89.70, date: "2025-12-30" },
    { name: "Andy M", amt: 81.60, date: "2025-12-13" }
  ];

  for (const p of payoutsToAdd) {
    const affId = affiliateMap[p.name.toLowerCase()];
    if (!affId) {
      console.log("No aff found for payout:", p.name);
      continue;
    }
    
    // check if it exists roughly
    const { data: extP } = await supabase.from('payouts').select('id').eq('affiliate_id', affId).eq('amount', p.amt).single();
    if (!extP) {
      const { error: pE } = await supabase.from('payouts').insert({
        affiliate_id: affId,
        amount: p.amt,
        status: 'paid', // assume requested or paid? They say "Payouts Table", usually means it's paid or pending. Let's do paid.
        created_at: new Date(p.date).toISOString(),
        payment_method: 'paypal' // default
      });
      if (pE) {
        console.log("Error inserting payout for", p.name, pE.message);
      } else {
         console.log("Inserted payout for", p.name);
      }
    }
  }
}

main();
