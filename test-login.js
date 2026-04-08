require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
    console.log("Looking up org by affiliates.cleverpoly.store");
    let { data: org1 } = await supabase.from('organizations').select('id, name, custom_domain, app_url').or('custom_domain.ilike.affiliates.cleverpoly.store,app_url.ilike.affiliates.cleverpoly.store,app_url.ilike.affiliates.cleverpoly');
    console.log("Org lookup:", org1);

    console.log("Looking up affiliate by email: cgmathv99@gmail.com");
    let { data: aff } = await supabase.from('affiliates').select('*').eq('email', 'cgmathv99@gmail.com');
    console.log("Afiliates lookup:", aff);
}
test();
