import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const email = 'cgmathv99@gmail.com';

    const { data: affiliate } = await admin.from('affiliates').select('org_id').eq('email', email).maybeSingle();
    const orgId = affiliate?.org_id;

    if (orgId) {
        const { data: orgInfo } = await admin.from('organizations').select('name, custom_domain').eq('id', orgId).maybeSingle();
        console.log('Org Info from DB:', orgInfo);
    }
}

run().catch(console.error);
