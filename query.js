const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: commissions, error: err1 } = await supabase.from('commissions').select('*').limit(5);
    console.log("Commissions sample:", commissions);
    
    // search for birdwrk86
    const { data: c2, error: err2 } = await supabase.from('commissions').select('*').ilike('customer_email', '%birdwrk86%');
    console.log("Commissions for birdwrk86:", c2);
}
run();
