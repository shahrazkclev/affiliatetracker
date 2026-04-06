const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const promotekitPayouts = [
    // Third screenshot data (Historical already paid out)
    { name: 'Abdul Ahad', amount: 29.70, date: '2026-04-29T10:00:00Z', period: 'Apr 29, 2026' },
    { name: 'Andy M', amount: 99.38, date: '2026-04-29T10:00:00Z', period: 'Apr 29, 2026' },
    { name: 'Fatima Sultan', amount: 63.36, date: '2026-04-29T10:00:00Z', period: 'Apr 29, 2026' },
    { name: 'Fatima Sultan', amount: 39.60, date: '2026-02-27T10:00:00Z', period: 'Feb 27, 2026' },
    { name: 'Fatima Sultan', amount: 59.40, date: '2026-01-30T10:00:00Z', period: 'Jan 30, 2026' },
    { name: 'Abdul Ahad', amount: 89.70, date: '2025-12-30T10:00:00Z', period: 'Dec 30, 2025' },
    { name: 'Andy M', amount: 81.60, date: '2025-12-13T10:00:00Z', period: 'Dec 13, 2025' },
    { name: 'Andy M', amount: 129.07, date: '2025-11-29T10:00:00Z', period: 'Nov 29, 2025' }
];

async function syncPromotekit() {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgs[0].id;
    
    // 1. Delete the incorrect dummy commissions we inserted earlier
    await supabase.from('commissions').delete().like('stripe_charge_id', 'manual_sync_%');
    console.log("Deleted erroneous dummy pending commissions.");

    // 2. Insert the actual historical payouts to mark their true legacy commissions as settled
    for (const p of promotekitPayouts) {
        let { data: affs } = await supabase.from('affiliates').select('id, name').ilike('name', `%${p.name}%`);
        if (!affs || affs.length === 0) {
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

        // Just blindly upsert or insert these historical payouts so our history table is 1:1 with Promotekit
        // To avoid duplicates if we already inserted some, let's delete them first or just assume they are unique by time & affiliate
        const { error } = await supabase.from('payouts').insert({
            id: crypto.randomUUID(),
            org_id: orgId,
            affiliate_id: affId,
            amount: p.amount,
            currency: 'USD',
            notes: 'Promotekit Legacy Sync',
            period: new Date(p.date).toISOString(), // Need to satisfy valid timestamp
            created_at: p.date
        });

        if (error) {
            console.error('Failed to sync Promotekit payout for', p.name, error.message);
        } else {
            console.log('Synced historical payout for', p.name, ' - ', p.amount);
        }
    }
    
    // Also cleanup the old 'Screenshot payout sync' log for duplicates
    await supabase.from('payouts').delete().eq('notes', 'Screenshot payout sync');

    console.log('Finished fully syncing Promotekit History.');
    process.exit(0);
}
syncPromotekit().catch(console.error);
