require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data, error } = await supabase
        .from('affiliates')
        .update({ total_commission: 0 })
        .neq('total_commission', 0);

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Successfully reset total_commission to 0 for all existing affiliates.");
    }
}

run();
