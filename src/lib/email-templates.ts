// ─────────────────────────────────────────────────────────────────────────────
// Shared header block
// The logo sits inside a white pill so it's always readable regardless of
// whether the email client renders in dark or light mode.
// ─────────────────────────────────────────────────────────────────────────────
function logoHeader(logoUrl?: string, logoHeight: number = 44): string {
  if (logoUrl) {
    return `
      <td align="center" style="padding-bottom:32px;">
        <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:10px 24px;border:1px solid #f3f4f6;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <img src="${logoUrl}" alt="Brand logo" height="${logoHeight}" style="display:block;max-height:${logoHeight}px;width:auto;" />
        </div>
      </td>`;
  }
  // Fallback: text logo
  return `
      <td align="center" style="padding-bottom:32px;">
        <div style="background:#ea580c;width:52px;height:52px;border-radius:14px;text-align:center;line-height:52px;color:#fff;font-size:24px;font-weight:800;margin:0 auto;box-shadow:0 2px 4px rgba(234,88,12,0.2);">C</div>
        <div style="margin-top:12px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;">Partner Program</div>
      </td>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared email shell (outer wrapper table, consistent padding & background)
// ─────────────────────────────────────────────────────────────────────────────
function emailShell(title: string, logoUrl: string | undefined, body: string, appUrl: string = 'https://affiliatemango.com', logoHeight: number = 44): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#f9fafb">
    <tr>
      <td align="center" style="padding:48px 16px 64px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:580px;">
          <tr>${logoHeader(logoUrl, logoHeight)}</tr>
          <tr>
            <td style="border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;background:#ffffff;padding:44px 40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
              ${body}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
                You're receiving this because you're part of the Partner Program.<br />
                <a href="${appUrl}/unsubscribe" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(text: string, bg: string = '#f3f4f6', border: string = '#e5e7eb', color: string = '#4b5563'): string {
  return `<div style="display:inline-block;background:${bg};border:1px solid ${border};border-radius:100px;padding:5px 14px;margin-bottom:20px;">
    <span style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.07em;text-transform:uppercase;">${text}</span>
  </div>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:32px;">
    <tr>
      <td align="left" bgcolor="#ea580c" style="border-radius:10px;box-shadow:0 2px 4px rgba(234,88,12,0.2);">
        <a href="${url}" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#ea580c;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function infoBox(rows: { label: string; value: string }[]): string {
  const inner = rows.map(r => `
    <tr>
      <td style="padding:10px 18px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0 0 3px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">${r.label}</p>
        <p style="margin:0;font-size:15px;color:#111827;font-family:monospace;">${r.value}</p>
      </td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:28px;">
    ${inner}
  </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW REFERRAL
// ─────────────────────────────────────────────────────────────────────────────
export const NEW_REFERRAL_TEMPLATE = (
  affiliateName: string,
  customerEmail: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'New Referral',
  logoUrl,
  `
  ${badge('New Referral 🎉', '#fff7ed', '#ffedd5', '#ea580c')}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Great news, ${affiliateName}!</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Someone just signed up through your affiliate link. Keep sharing to stack those commissions!</p>
  ${infoBox([
    { label: 'Customer', value: customerEmail || 'Hidden for privacy' },
    { label: 'Status', value: 'Pending first purchase' },
  ])}
  ${ctaButton('View in Dashboard →', appUrl)}
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// NEW COMMISSION
// ─────────────────────────────────────────────────────────────────────────────
export const NEW_COMMISSION_TEMPLATE = (
  affiliateName: string,
  amount: string,
  customerEmail?: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'Commission Earned',
  logoUrl,
  `
  ${badge('Commission Earned 💰', '#f0fdf4', '#dcfce7', '#16a34a')}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Cha-ching, ${affiliateName}!</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">A purchase was made through your referral. Here's what you earned:</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:28px;text-align:center;">
    <tr>
      <td style="padding:28px 18px;">
        <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Amount Earned</p>
        <p style="margin:0;font-size:42px;color:#10b981;font-weight:800;letter-spacing:-0.02em;">$${amount}</p>
        ${customerEmail ? `<p style="margin:14px 0 0;font-size:13px;color:#6b7280;">From customer: <span style="color:#9ca3af;font-family:monospace;">${customerEmail}</span></p>` : ''}
      </td>
    </tr>
  </table>
  <p style="margin:0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">Your earnings will be included in your next payout cycle. Log in to track your balance and referral activity.</p>
  ${ctaButton('View Commission →', appUrl)}
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT GENERATED
// ─────────────────────────────────────────────────────────────────────────────
export const PAYOUT_GENERATED_TEMPLATE = (
  affiliateName: string,
  amount: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'Payout Processed',
  logoUrl,
  `
  ${badge('Payout Sent 💸', '#eff6ff', '#dbeafe', '#2563eb')}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Your payout is on the way!</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Hi ${affiliateName}, your latest payout has been processed and will arrive in your payout account within 1–3 business days.</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:28px;text-align:center;">
    <tr>
      <td style="padding:28px 18px;">
        <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Payout Amount</p>
        <p style="margin:0;font-size:42px;color:#3b82f6;font-weight:800;letter-spacing:-0.02em;">$${amount}</p>
      </td>
    </tr>
  </table>
  ${infoBox([
    { label: 'Status', value: 'Processing — arrives in 1–3 business days' },
  ])}
  ${ctaButton('View Payout History →', appUrl)}
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT APPROVED
// ─────────────────────────────────────────────────────────────────────────────
export const ACCOUNT_APPROVED_TEMPLATE = (
  affiliateName: string,
  referralCode?: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'Account Approved',
  logoUrl,
  `
  ${badge('Account Approved ✅', '#f0fdf4', '#dcfce7', '#16a34a')}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Welcome to the team, ${affiliateName}!</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Your affiliate application has been approved. You can now access your dashboard, copy your referral link, and start earning commissions.</p>
  ${referralCode ? infoBox([{ label: 'Your Referral Code', value: referralCode }]) : ''}
  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Here's what you can do:</p>
  <ul style="margin:8px 0 24px 20px;padding:0;color:#4b5563;font-size:14px;line-height:2;">
    <li>Copy your unique referral link from the dashboard</li>
    <li>Share it on social media, emails, or your website</li>
    <li>Earn a commission each time someone purchases using your link</li>
    <li>Track your earnings and request payouts anytime</li>
  </ul>
  ${ctaButton('Access Dashboard →', appUrl)}
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT REVISION REQUIRED
// ─────────────────────────────────────────────────────────────────────────────
export const ACCOUNT_REVISION_TEMPLATE = (
  affiliateName: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'Application Update Required',
  logoUrl,
  `
  ${badge('Action Required ⚠️', '#fffbeb', '#fef3c7', '#d97706')}
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Hi ${affiliateName},</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">We reviewed your affiliate application and need a bit more information before we can approve it.</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Please log in to your dashboard to see the details and update your application. We'll review it again as soon as you resubmit.</p>
  ${ctaButton('Update Application →', appUrl)}
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH LINKS (PASSWORD RESET, SETUP, MAGIC LINK)
// ─────────────────────────────────────────────────────────────────────────────
export const AUTH_LINK_TEMPLATE = (
  subject: string,
  preHeaderText: string,
  ctaText: string,
  actionLink: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  subject,
  logoUrl,
  `
  <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">${subject}</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">${preHeaderText}</p>
  ${ctaButton(ctaText, actionLink)}
  <p style="margin:30px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If you didn't request this email, you can safely ignore it.</p>
  `,
  appUrl,
  logoHeight
);

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE INVITATION
// ─────────────────────────────────────────────────────────────────────────────
export const AFFILIATE_INVITATION_TEMPLATE = (
  inviteUrl: string,
  appUrl: string = 'https://affiliatemango.com',
  logoUrl?: string,
  logoHeight: number = 44
) => emailShell(
  'You have been invited to join our Partner Program',
  logoUrl,
  `${badge('Invitation', '#eff6ff', '#bfdbfe', '#2563eb')}
  <h1 style="margin:0 0 16px;font-size:26px;color:#111827;font-weight:800;letter-spacing:-0.02em;line-height:1.2;">Partner Program Invitation 🎉</h1>
  <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">You've been invited to join our exclusive affiliate partner program! Click the button below to sign up, get your unique tracking link, and start earning commissions today.</p>
  ${ctaButton('Accept Invitation', inviteUrl)}
  `,
  appUrl,
  logoHeight
);
