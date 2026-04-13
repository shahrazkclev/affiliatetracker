require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const email = 'cgmathv99@gmail.com';
    const appUrl = 'https://affiliates.cleverpoly.store';

    console.log("Calling generateLink with redirectTo:", `${appUrl}/auth/callback?next=/reset-password`);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/reset-password` }
    });

    if (linkErr) {
        console.error('generateLink error:', linkErr);
    } else {
        console.log('Action Link:', linkData.properties.action_link);
    }
}

run().catch(console.error);
