import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { AUTH_LINK_TEMPLATE } from './src/lib/email-templates';
import { dispatchEmail } from './src/lib/email';

dotenv.config({ path: '.env.local' });

async function run() {
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const email = 'cgmathv99@gmail.com';
    const fakeSiteUrl = 'http://partners.cleverpoly.store';

    console.log(`Testing email script for: ${email}`);
    
    // Find custom domain from DB
    const { data: affiliate, error: affErr } = await admin.from('affiliates').select('org_id').eq('email', email).maybeSingle();
    if (affErr) {
      console.error('Failed to find affiliate:', affErr);
      return;
    }
    
    const orgId = affiliate?.org_id;
    if (!orgId) {
      console.log('No org_id found for affiliate');
      return;
    }
    
    let appUrl = fakeSiteUrl;
    let logoUrl, logoHeight;

    if (orgId) {
        const { data: orgInfo } = await admin.from('organizations').select('logo_url, logo_email_height, custom_domain').eq('id', orgId).maybeSingle();
        logoUrl = orgInfo?.logo_url;
        logoHeight = orgInfo?.logo_email_height;
        if (orgInfo?.custom_domain) {
            appUrl = `https://${orgInfo.custom_domain}`;
        }
    }

    console.log(`Resolved appUrl to: ${appUrl}`);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/reset-password` }
    });

    if (linkErr) {
        console.error('Generate Link Error:', linkErr.message);
        return;
    }

    if (linkData?.properties?.action_link) {
        console.log(`Generated Action Link: ${linkData.properties.action_link}`);
        const htmlContent = AUTH_LINK_TEMPLATE(
            'Reset Password',
            'Someone requested a password reset for your account. If this was you, click the button below to choose a new password.',
            'Reset Password',
            linkData.properties.action_link,
            appUrl,
            logoUrl,
            logoHeight
        );
        const res = await dispatchEmail(orgId, { to: email, subject: 'Reset Your Password (Test)', html: htmlContent, _rawHtmlOverride: true } as any);
        console.log('Dispatch Result:', res);
    }
}

run().catch(console.error);
