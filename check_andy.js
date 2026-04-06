const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAndy() {
    const { data: affs } = await supabase.from('affiliates').select('id, name, email').ilike('name', '%Andy%');
    console.log("Found affiliates:", affs);
    if (!affs || affs.length === 0) return process.exit(0);
    
    // Check commissions
    for (const a of affs) {
        const { data: comms } = await supabase.from('commissions').select('*').eq('affiliate_id', a.id).eq('status', 'pending');
        console.log(`Pending comms for ${a.name}:`, comms.length);
        if (comms.length > 0) {
            console.log(comms);
        }
    }
    process.exit(0);
}
checkAndy().catch(console.error);
