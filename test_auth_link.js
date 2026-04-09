const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: 'cgdora4@gmail.com',
    options: {
      redirectTo: 'https://dashboard.affiliatemango.com/auth/callback'
    }
  });
  console.log(data?.properties?.action_link, error);
}
run();
