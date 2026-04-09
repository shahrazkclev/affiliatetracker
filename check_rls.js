const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// We need an admin postgres connection or RPC. If we can't do RPC, we'll just check if RLS is enabled via API failure tests.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRLS() {
    console.log("Checking if backend relies heavily on RLS for tenant isolation...");
    
    // Attempt anon access to organizations
    const { data, error } = await supabase.from('organizations').select('id, name').limit(1);
    
    if (error && error.code === '42501') {
        console.log("Organizations table has strict RLS preventing anon reads.");
    } else {
        console.log("Organizations RLS allowed anon read, or returned data:", data);
    }
}
checkRLS().catch(console.error);
