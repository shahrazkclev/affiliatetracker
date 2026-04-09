const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl || !supabaseKey) { console.log("Missing env"); return; }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Find Cleverpoly Org
  const { data: org } = await supabase.from('organizations').select('*').limit(1).single();
  console.log("Org found:", org.name);
  console.log("SMTP Host config:", org.smtp_host);
  
  if (!org.smtp_host) {
    console.log("No custom SMTP configured for org");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: org.smtp_host,
    port: org.smtp_port,
    secure: org.smtp_port === 465,
    auth: { user: org.smtp_user, pass: org.smtp_pass }
  });

  try {
    const info = await transporter.sendMail({
      from: `"${org.name}" <${org.smtp_from_email}>`,
      to: "cgmathv99@gmail.com",
      subject: "Test Send from Next.js implementation!",
      html: "<p>If you get this, your custom Hostinger SMTP is fully working via the new Next.js engine!</p>"
    });
    console.log("Message sent successfully!", info.messageId);
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}
run();
