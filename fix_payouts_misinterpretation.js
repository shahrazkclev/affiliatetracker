const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const owedList = [
    { name: 'Ahmad ali', amount: 185.13 },
    { name: 'Zaid Ali', amount: 128.81 },
    { name: 'chap1 course', amount: 29.75 },
    { name: 'not your skills video', amount: 29.70 },
    { name: 'fix portfolio', amount: 29.15 },
    { name: 'Creative Sav', amount: 20.85 },
    { name: 'Levar Boutte', amount: 15.29 },
    { name: 'Angela Ryu', amount: 13.76 },
    { name: 'Maniha Tahir', amount: 7.50 },
    { name: 'Haadi Mohammed', amount: 3.60 },
    { name: 'Haris Khan', amount: 2.40 }
];

async function fixData() {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgs[0].id;
    
    // 1. Delete all previous 'Screenshot payout sync' payouts
    await supabase.from('payouts').delete().eq('notes', 'Screenshot payout sync');
    console.log("Deleted erroneous payouts.");

    // 2. Insert missing commissions for owed amount
    for (const p of owedList) {
        // Find affiliate precisely by ILIKE but accommodating spaces (just in case)
        let { data: affs } = await supabase.from('affiliates').select('id, name').ilike('name', `%${p.name}%`);
        if (!affs || affs.length === 0) {
            // fallback for chap1 course double space issue
            if (p.name === 'chap1 course') {
                 let res = await supabase.from('affiliates').select('id, name').ilike('name', `%chap1%course%`);
                 affs = res.data;
            }
        }
        
        let affId;
        if (affs && affs.length > 0) {
            affId = affs[0].id;
        } else {
            console.warn('Could not find affiliate matching:', p.name);
            continue;
        }

        // Insert commission
        const { error } = await supabase.from('commissions').insert({
            id: crypto.randomUUID(),
            org_id: orgId,
            affiliate_id: affId,
            stripe_charge_id: 'manual_sync_' + crypto.randomUUID(),
            revenue: p.amount / 0.3, // approximate revenue at 30% comms
            commission_amount: p.amount,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error('Failed to insert commission for', p.name, error.message);
        } else {
            console.log('Inserted pending commission for', p.name);
        }
    }
    console.log('Done.');
    process.exit(0);
}
fixData().catch(console.error);
