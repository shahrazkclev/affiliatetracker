const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  console.log("Organizations columns:", data && data.length ? Object.keys(data[0]) : "No data");
  
  // Is there a team_members or users or similar relation?
  // Let's query information_schema for tables that might relate to team
  const { data: tables } = await supabase.rpc('get_tables'); 
  // wait we can just do a postgres query
}
run();
