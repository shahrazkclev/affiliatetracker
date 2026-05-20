'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { dispatchEmail } from '@/lib/email';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function registerPlatformOwner(formData: FormData): Promise<{ error?: string; verifyEmail?: boolean; email?: string }> {
    const admin = getAdminClient();
    
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const companyName = (formData.get('companyName') as string)?.trim() || 'My Company';

    if (!email || !password) return { error: 'Email and password are required.' };
    if (password !== confirmPassword) return { error: 'Passwords do not match.' };
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

    // Check if user already exists
    const { data: pwCheck } = await admin.rpc('check_user_has_password', { user_email: email });
    const userExists = pwCheck && pwCheck[0]?.user_exists === true;
    if (userExists) {
        return { error: 'An account with this email already exists.' };
    }

    const siteHost = (await import('next/headers')).headers().then(h => h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "partners.affiliatemango.com");
    const isLocal = (await siteHost).includes('localhost');
    const SITE_URL = isLocal ? `http://${await siteHost}` : `https://${await siteHost}`;

    // Create user and generate verification link (does not automatically send email)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
            redirectTo: `${SITE_URL}/auth/callback?next=/register/configure`,
            data: {
                full_name: companyName
            }
        }
    });

    if (linkErr) return { error: linkErr.message };
    if (!linkData?.user) return { error: 'Failed to create user account.' };

    const userId = linkData.user.id;

    // Check if an org already belongs to this user (fail-safe)
    const { data: existingOrg } = await admin
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

    let orgId = existingOrg?.id;

    // If no org exists, provision one!
    if (!orgId) {
        // Generate a base slug from the company name
        let baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!baseSlug) baseSlug = 'tenant';

        // Ensure uniqueness for the slug by checking against existing custom_domains
        let finalSlug = baseSlug;
        let isUnique = false;
        let counter = 0;

        while (!isUnique) {
            const { data: check } = await admin
                .from('organizations')
                .select('id')
                .eq('custom_domain', finalSlug)
                .maybeSingle();

            if (!check) {
                isUnique = true;
            } else {
                counter++;
                finalSlug = `${baseSlug}${counter}`;
            }
        }

        const { data: newOrg, error: orgError } = await admin
            .from('organizations')
            .insert({
                owner_id: userId,
                name: companyName,
                custom_domain: finalSlug // Store the slug here! Real domains will have dots (.) later.
            })
            .select('id')
            .single();

        if (orgError) {
            console.error('[Register] Creating organization failed:', orgError);
            return { error: 'Could not provision your organization workspace. Please contact support.' };
        }
        orgId = newOrg.id;

        // Provision default campaign
        const { error: campaignError } = await admin.from('campaigns').insert({
            org_id: orgId,
            name: `${companyName} Affiliate Program`,
            is_default: true,
            reward_type: 'percentage',
            reward_value: 30,
            cookie_days: 60
        });

        if (campaignError) {
            console.error('[Register] Initializing default campaign failed:', campaignError);
        }

        // Provision default portal-config
        const { error: portalError } = await admin.from('portal_configs').insert({
            org_id: orgId,
            company_name: companyName,
            brand_color: '#f97316',
            brand_logo_url: null,
            terms_url: null,
            privacy_url: null
        });

        if (portalError) {
            console.error('[Register] Initializing default portal config failed:', portalError);
        }
    }

    // Send email verification manually via AffiliateMango branding
    const verificationHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Verify Your Email</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:48px 16px 64px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
      <tr>
        <td align="center" style="padding-bottom:32px;">
          <div style="display:inline-block;background:#fff;border-radius:14px;padding:10px 24px;border:1px solid #f3f4f6;">
            <img src="https://dashboard.affiliatemango.com/affiliatemango_logo.png" alt="AffiliateMango Logo" height="44" style="display:block;width:auto;" />
          </div>
        </td>
      </tr>
      <tr><td style="border-radius:18px;border:1px solid #e5e7eb;background:#fff;padding:44px 40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;line-height:1.25;color:#111827;">Verify your email address</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#4b5563;">Thank you for registering! Please verify your email address to activate your AffiliateMango workspace.</p>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:32px;">
            <tr><td align="left" bgcolor="#ea580c" style="border-radius:10px;box-shadow:0 2px 4px rgba(234,88,12,0.2);">
                <a href="${linkData.properties.action_link}" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:#ea580c;">Verify Email</a>
            </td></tr>
        </table>
        <p style="margin:30px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If you didn't create an account, you can safely ignore this email.</p>
      </td></tr>
      <tr><td align="center" style="padding-top:32px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
          AffiliateMango &copy; ${new Date().getFullYear()}
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

    await dispatchEmail(null, {
        to: email,
        subject: 'Verify your email address — AffiliateMango',
        html: verificationHtml,
        _rawHtmlOverride: true
    });

    revalidatePath('/', 'layout');

    return { verifyEmail: true, email };
}
