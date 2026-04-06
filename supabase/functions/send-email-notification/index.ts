import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { 
    NEW_REFERRAL_TEMPLATE, 
    NEW_COMMISSION_TEMPLATE, 
    PAYOUT_GENERATED_TEMPLATE, 
    ACCOUNT_APPROVED_TEMPLATE, 
    ACCOUNT_REVISION_TEMPLATE 
} from "./templates.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log('Received webhook payload:', payload);

        const { table, type, record, old_record } = payload;

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch org logo upfront — used in every template
        let orgLogoUrl: string | undefined;
        let orgLogoEmailHeight: number = 44;
        try {
            const { data: org } = await supabase
                .from('organizations')
                .select('logo_url, logo_email_height')
                .limit(1)
                .single();
            orgLogoUrl = org?.logo_url || undefined;
            orgLogoEmailHeight = org?.logo_email_height ?? 44;
        } catch (_) { /* silently continue without logo */ }

        let affiliateId = null;
        let eventType = null;

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
                return new Response(JSON.stringify({ message: "No relevant status change" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        } else if (table === 'test_email') {
            affiliateId = 'test';
            eventType = 'test_email';
        } else {
            return new Response(JSON.stringify({ message: "Ignored event" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (!affiliateId) {
            return new Response(JSON.stringify({ error: "No affiliate ID found" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Fetch affiliate details
        let affiliate = record || {};
        if (eventType === 'test_email') {
            affiliate = { name: 'Test User', email: 'cgdora4@gmail.com', notify_test_email: true };
        } else if (table !== 'affiliates') {
            const { data, error } = await supabase
                .from('affiliates')
                .select('*')
                .eq('id', affiliateId)
                .single();
            if (error || !data) {
                console.error('Error fetching affiliate:', error);
                return new Response(JSON.stringify({ error: "Affiliate not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            affiliate = data;
        }

        const affiliateName = affiliate.name?.split(' ')[0] || 'Partner';
        const affiliateEmail = affiliate.email;

        const preferences = {
            new_commission:    affiliate.notify_new_commission    ?? true,
            new_referral:      affiliate.notify_new_referral      ?? true,
            payout_generated:  affiliate.notify_payout_generated  ?? true,
            account_approved:  affiliate.notify_account_approved  ?? true,
            account_revision:  affiliate.notify_account_revision  ?? true,
            test_email:        affiliate.notify_test_email        ?? true,
        };

        if (!preferences[eventType as keyof typeof preferences]) {
            console.log(`Notification disabled by affiliate for event: ${eventType}`);
            return new Response(JSON.stringify({ message: "Notification disabled by user" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
            subject = 'Test email from Cleverpoly ✔';
            htmlContent = `<p style="font-family:sans-serif;color:#333;">Hello! This is a test email from Cleverpoly Affiliates.</p>`;
        }

        // Send via Make webhook
        const makeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL') || '';
        const makeWebhookAuth = Deno.env.get('MAKE_WEBHOOK_AUTH') || '';

        console.log(`Sending email to ${affiliateEmail} for event: ${eventType}, logo: ${orgLogoUrl || 'none'}`);

        const response = await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-make-apikey': makeWebhookAuth
            },
            body: JSON.stringify({
                email: affiliateEmail,
                subject: subject,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Make webhook failed with status ${response.status}: ${errorText}`);
        }

        console.log('Email sent successfully');
        return new Response(JSON.stringify({ success: true, message: "Email sent" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
