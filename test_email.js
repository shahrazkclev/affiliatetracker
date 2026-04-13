require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

async function run() {
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const email = 'cgmathv99@gmail.com';

    // --- 1. Find org + custom domain ---
    const { data: affiliate } = await admin.from('affiliates').select('org_id').eq('email', email).maybeSingle();
    const orgId = affiliate?.org_id;
    if (!orgId) { console.error('No org found'); return; }

    const { data: org } = await admin.from('organizations').select('*').eq('id', orgId).single();
    const customDomain = org.custom_domain; // e.g. affiliates.cleverpoly.store
    const appUrl = customDomain ? `https://${customDomain}` : 'https://partners.affiliatemango.com';

    // --- 2. The redirect goes to OUR Site URL (partners.affiliatemango.com),
    //        but encodes return_to so the reset page knows where to send them back ---
    const returnParam = customDomain ? `&return_to=${customDomain}` : '';
    const redirectTo = `https://partners.affiliatemango.com/auth/callback?next=/reset-password${returnParam}`;

    console.log('Custom domain from DB:', customDomain);
    console.log('Encoded redirectTo:', redirectTo);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo }
    });

    if (linkErr) { console.error('generateLink error:', linkErr.message); return; }

    console.log('Action link redirect_to:', new URL(linkData.properties.action_link).searchParams.get('redirect_to'));

    // --- 3. Build the clean white/grey/orange email ---
    function ctaButton(text, url) {
        return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:32px;">
            <tr><td align="left" bgcolor="#ea580c" style="border-radius:10px;box-shadow:0 2px 4px rgba(234,88,12,0.2);">
                <a href="${url}" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#ea580c;">${text}</a>
            </td></tr>
        </table>`;
    }

    const logoHtml = org.logo_url
        ? `<td align="center" style="padding-bottom:32px;">
               <div style="display:inline-block;background:#fff;border-radius:14px;padding:10px 24px;border:1px solid #f3f4f6;">
                 <img src="${org.logo_url}" alt="Logo" height="${org.logo_email_height || 44}" style="display:block;width:auto;" />
               </div>
           </td>`
        : `<td align="center" style="padding-bottom:32px;">
               <div style="background:#ea580c;width:52px;height:52px;border-radius:14px;text-align:center;line-height:52px;color:#fff;font-size:24px;font-weight:800;margin:0 auto;">C</div>
               <div style="margin-top:12px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;">Partner Program</div>
           </td>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Reset Password</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:48px 16px 64px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
      <tr>${logoHtml}</tr>
      <tr><td style="border-radius:18px;border:1px solid #e5e7eb;background:#fff;padding:44px 40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Reset Password</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Someone requested a password reset for your account. If this was you, click the button below to choose a new password.</p>
        ${ctaButton('Reset Password', linkData.properties.action_link)}
        <p style="margin:30px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If you didn't request this email, you can safely ignore it.</p>
      </td></tr>
      <tr><td align="center" style="padding-top:32px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
          You're receiving this because you're part of the Partner Program.<br/>
          <a href="${appUrl}/unsubscribe" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

    // --- 4. Send via org SMTP or global SMTP ---
    let host = org.smtp_host || process.env.GLOBAL_SMTP_HOST;
    let port = org.smtp_port || parseInt(process.env.GLOBAL_SMTP_PORT || '465', 10);
    let user = org.smtp_user || process.env.GLOBAL_SMTP_USER;
    let pass = org.smtp_pass || process.env.GLOBAL_SMTP_PASS;
    let fromEmail = org.smtp_from_email || process.env.GLOBAL_SMTP_FROM || 'noreply@affiliatemango.com';

    const transporter = nodemailer.createTransport({
        host, port, secure: port === 465, auth: { user, pass }
    });

    await transporter.sendMail({
        from: `"${org.name} Partners" <${fromEmail}>`,
        to: email,
        subject: 'Reset Your Password',
        html,
    });

    console.log('✅ Email dispatched successfully to', email);
}

run().catch(console.error);
