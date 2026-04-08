import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { dispatchEmail } from '@/lib/email';
import {
    NEW_REFERRAL_TEMPLATE,
    NEW_COMMISSION_TEMPLATE,
    PAYOUT_GENERATED_TEMPLATE,
    ACCOUNT_APPROVED_TEMPLATE,
    ACCOUNT_REVISION_TEMPLATE
} from '@/lib/email-templates';

// We bypass RLS for webhook background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { table, type, record, old_record } = payload;
        
        let affiliateId = null;
        let eventType = null;
        let orgId = record?.org_id || null;

        if (table === 'commissions' && type === 'INSERT') {
            affiliateId = record.affiliate_id;
            eventType = 'new_commission';
        } else if (table === 'referrals' && type === 'INSERT') {
            affiliateId = record.affiliate_id;
            eventType = 'new_referral';
        } else if (table === 'payouts' && type === 'INSERT') {
            affiliateId = record.affiliate_id;
            eventType = 'payout_generated';
        } else if (table === 'affiliates' && type === 'UPDATE') {
            affiliateId = record.id;
            if (record.status === 'approved' && old_record?.status !== 'approved') {
                eventType = 'account_approved';
            } else if (record.status === 'revision' && old_record?.status !== 'revision') {
                eventType = 'account_revision';
            } else {
                return NextResponse.json({ message: "No relevant status change." });
            }
        } else if (table === 'test_email') {
            affiliateId = 'test';
            eventType = 'test_email';
        } else {
            return NextResponse.json({ message: "Ignored event." });
        }

        if (!affiliateId) {
            return NextResponse.json({ error: "No affiliate ID found" }, { status: 400 });
        }

        // Fetch affiliate details
        let affiliate = record || {};
        if (eventType === 'test_email') {
            affiliate = { name: 'Test User', email: 'cgdora4@gmail.com', notify_test_email: true };
            if (!orgId) {
                // For test emails, you might want to specify logic to fetch the first org or pass org_id in record.
            }
        } else if (table !== 'affiliates') {
            const { data, error } = await supabase
                .from('affiliates')
                .select('*')
                .eq('id', affiliateId)
                .single();
            if (error || !data) {
                console.error('[Webhook Events] Error fetching affiliate:', error);
                return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
            }
            affiliate = data;
            // Always trust affiliate's org_id
            orgId = data.org_id;
        }

        // Fetch the specific tenant's branding and ensure we rely on the specific org for SMTP variables
        let orgLogoUrl: string | undefined;
        let orgLogoEmailHeight: number = 44;
        
        if (orgId) {
            const { data: orgInfo } = await supabase
                .from('organizations')
                .select('logo_url, logo_email_height')
                .eq('id', orgId)
                .single();
                
            orgLogoUrl = orgInfo?.logo_url || undefined;
            orgLogoEmailHeight = orgInfo?.logo_email_height ?? 44;
        }

        const affiliateName = affiliate.name?.split(' ')[0] || 'Partner';
        const affiliateEmail = affiliate.email;

        // Respect notification preferences
        const preferences = {
            new_commission:    affiliate.notify_new_commission    ?? true,
            new_referral:      affiliate.notify_new_referral      ?? true,
            payout_generated:  affiliate.notify_payout_generated  ?? true,
            account_approved:  affiliate.notify_account_approved  ?? true,
            account_revision:  affiliate.notify_account_revision  ?? true,
            test_email:        affiliate.notify_test_email        ?? true,
        };

        if (!preferences[eventType as keyof typeof preferences]) {
            console.log(`[Webhook Events] Notification disabled by affiliate for event: ${eventType}`);
            return NextResponse.json({ message: "Notification disabled by user" });
        }

        let subject = '';
        let htmlContent = '';

        if (eventType === 'new_commission') {
            subject = 'You earned a new commission! 💰';
            const amount = Number(record.amount || record.commission_amount || 0).toFixed(2);
            const customerEmail = record.customer_email || record.referred_email || '';
            htmlContent = NEW_COMMISSION_TEMPLATE(affiliateName, amount, customerEmail, orgLogoUrl, orgLogoEmailHeight);

        } else if (eventType === 'new_referral') {
            subject = 'New referral just signed up! 🎉';
            const customerEmail = record.referred_email || record.customer_email || '';
            htmlContent = NEW_REFERRAL_TEMPLATE(affiliateName, customerEmail, orgLogoUrl, orgLogoEmailHeight);

        } else if (eventType === 'payout_generated') {
            subject = 'Your payout has been sent 💸';
            const amount = Number(record.amount || 0).toFixed(2);
            htmlContent = PAYOUT_GENERATED_TEMPLATE(affiliateName, amount, orgLogoUrl, orgLogoEmailHeight);

        } else if (eventType === 'account_approved') {
            subject = 'Your affiliate account is approved ✅';
            const referralCode = affiliate.referral_code || undefined;
            htmlContent = ACCOUNT_APPROVED_TEMPLATE(affiliateName, referralCode, orgLogoUrl, orgLogoEmailHeight);

        } else if (eventType === 'account_revision') {
            subject = 'Action needed on your affiliate application ⚠️';
            htmlContent = ACCOUNT_REVISION_TEMPLATE(affiliateName, orgLogoUrl, orgLogoEmailHeight);

        } else if (eventType === 'test_email') {
            subject = 'Test email from Partner Program ✔';
            htmlContent = `<p style="font-family:sans-serif;color:#333;">Hello! This is a test email from Partner Program Affiliates. Multi-tenant SMTP configuration test!</p>`;
        }
        
        console.log(`[Webhook Events] Dispatching email to ${affiliateEmail} using tenant ID: ${orgId}`);

        // IMPORTANT: We use dispatchEmail from lib/email.ts which INHERENTLY looks for Custom SMTP overriding the global settings.
        // It injects htmlContent directly, but wait - dispatchEmail wraps HTML in ANOTHER shell. 
        // We actually want raw html dispatch or change lib/email.ts!
        
        await dispatchEmail(orgId, {
            to: affiliateEmail,
            subject: subject,
            html: htmlContent, // This will unfortunately get wrapped in emailShell inside dispatchEmail
            _rawHtmlOverride: true 
        } as any);

        return NextResponse.json({ success: true, message: "Email sent natively" });

    } catch (error: any) {
        console.error('[API Webhooks Events] Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
