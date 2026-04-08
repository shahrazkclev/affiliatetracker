const { createClient } = require('@supabase/supabase-js');
try {
  createClient('https://ahpfekhoaariwtghswit.supabase.co', '');
} catch(e) {
  console.log("Error:", e.message);
}
