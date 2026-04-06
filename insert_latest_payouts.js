const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const payoutsList = [
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

async function insertPayouts() {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    if (!orgs || orgs.length === 0) {
        console.error('No organization found');
        return process.exit(1);
    }
    const orgId = orgs[0].id;
    
    let processed = 0;
    for (const p of payoutsList) {
        // Try finding affiliate by exact or partial name match
        const { data: affs } = await supabase.from('affiliates').select('id, name').ilike('name', `%${p.name}%`);
        
        let affId;
        if (affs && affs.length > 0) {
            affId = affs[0].id;
        } else {
            console.warn('Could not find affiliate matching:', p.name);
            continue;
        }

        const { error } = await supabase.from('payouts').insert({
            org_id: orgId,
            affiliate_id: affId,
            amount: p.amount,
            currency: 'USD',
            notes: 'Screenshot payout sync',
            period: new Date('2026-04-29T00:00:00Z').toISOString(),
            created_at: new Date('2026-04-29T10:00:00Z').toISOString()
        });

        if (error) {
            console.error('Failed to insert payout for', p.name, error);
        } else {
            processed++;
            console.log('Inserted payout for', p.name);
        }
    }
    console.log('Finished inserting ' + processed + ' payouts.');
    // Force process exit
    process.exit(0);
}
insertPayouts();
