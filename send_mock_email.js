const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Fetch Cleverpoly
  const { data: orgs } = await supabase.from('organizations').select('id, name, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, logo_url, logo_email_height').limit(5);
  const clever = orgs.find(o => o.name === 'Cleverpoly') || orgs[0];
  
  if (!clever.smtp_host) {
    console.log("No SMTP found for cleverpoly");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: clever.smtp_host,
    port: clever.smtp_port,
    secure: clever.smtp_port === 465,
    auth: { user: clever.smtp_user, pass: clever.smtp_pass }
  });

  const amount = "250.00";
  const affiliateName = "Test User";
  
  const logoHeader = `
      <td align="center" style="padding-bottom:32px;">
        <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:10px 24px;">
          <img src="${clever.logo_url}" alt="Brand logo" height="${clever.logo_email_height || 44}" style="display:block;max-height:${clever.logo_email_height || 44}px;width:auto;" />
        </div>
      </td>`;

  const badge = `<div style="display:inline-block;background:#312e81;border:1px solid #3730a3;border-radius:100px;padding:5px 14px;margin-bottom:20px;">
    <span style="font-size:11px;font-weight:700;color:#818cf8;letter-spacing:0.07em;text-transform:uppercase;">Payout Sent 💸</span>
  </div>`;
  
  const infoBox = `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#18181b;border:1px solid #27272a;border-radius:12px;margin-bottom:28px;">
    <tr>
      <td style="padding:10px 18px;border-bottom:1px solid #27272a;">
        <p style="margin:0 0 3px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Status</p>
        <p style="margin:0;font-size:15px;color:#e4e4e7;font-family:monospace;">Processing — arrives in 1–3 business days</p>
      </td>
    </tr>
  </table>`;

  const ctaButton = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:32px;">
    <tr>
      <td align="left" bgcolor="#ea580c" style="border-radius:10px;">
        <a href="https://affiliatemango.com" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#ea580c;">View Payout History →</a>
      </td>
    </tr>
  </table>`;

  const body = `
  ${badge}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#fafafa;">Your payout is on the way!</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#71717a;">Hi ${affiliateName}, your latest payout has been processed and will arrive in your payout account within 1–3 business days.</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#18181b;border:1px solid #27272a;border-radius:12px;margin-bottom:28px;text-align:center;">
    <tr>
      <td style="padding:28px 18px;">
        <p style="margin:0 0 6px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Payout Amount</p>
        <p style="margin:0;font-size:42px;color:#a5b4fc;font-weight:800;letter-spacing:-0.02em;">$${amount}</p>
      </td>
    </tr>
  </table>
  ${infoBox}
  ${ctaButton}
  `;

  const emailHTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payout Processed</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#09090b">
    <tr>
      <td align="center" style="padding:48px 16px 64px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:580px;">
          <tr>${logoHeader}</tr>
          <tr>
            <td style="border-radius:18px;overflow:hidden;border:1px solid #27272a;background:#111113;padding:44px 40px;">
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Cleverpoly Partners" <${clever.smtp_from_email}>`,
    to: 'cgmathv99@gmail.com',
    subject: 'Your payout has been sent 💸',
    html: emailHTML,
  });

  console.log("Simulated email successfully sent to cgmathv99@gmail.com!");
}

run().catch(console.error);
