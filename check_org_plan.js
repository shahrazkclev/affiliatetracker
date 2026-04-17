import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data } = await supabase.from('organizations').select('id, name, is_free_forever, plan_name, saas_plans(name, custom_smtp_access, custom_domain_access)');
    console.log(JSON.stringify(data, null, 2));
}
run();
