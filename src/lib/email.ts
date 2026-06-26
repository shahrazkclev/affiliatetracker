import nodemailer from 'nodemailer';
import { createClient as createAdminClient } from '@supabase/supabase-js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    _rawHtmlOverride?: boolean;
    brandNameOverride?: string;
}

/** Strip wrapping quotes — common when env vars are pasted with "..." in hosting dashboards */
function cleanEnv(value: string | undefined): string | undefined {
    if (!value) return value;
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

export async function dispatchEmail(orgId: string | null, options: EmailOptions) {
    let host = cleanEnv(process.env.GLOBAL_SMTP_HOST);
    let port = parseInt(cleanEnv(process.env.GLOBAL_SMTP_PORT) || '465', 10);
    let user = cleanEnv(process.env.GLOBAL_SMTP_USER);
    let pass = cleanEnv(process.env.GLOBAL_SMTP_PASS);
    let fromEmail = cleanEnv(process.env.GLOBAL_SMTP_FROM) || 'noreply@affiliatemango.com';
    let brandName = options.brandNameOverride || 'AffiliateMango';
    let brandColor = '#f97316'; // orange-500

    if (orgId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabase = createAdminClient(supabaseUrl, supabaseServiceKey);

        const { data: org } = await supabase
            .from('organizations')
            .select('name, primary_color, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email')
            .eq('id', orgId)
            .single();

        if (org) {
            brandName = options.brandNameOverride || org.name || brandName;
            brandColor = org.primary_color || brandColor;

            // Override with tenant's specific SMTP if all required fields are present
            if (org.smtp_host && org.smtp_port && org.smtp_user && org.smtp_pass && org.smtp_from_email) {
                host = cleanEnv(org.smtp_host) ?? org.smtp_host;
                port = org.smtp_port;
                user = cleanEnv(org.smtp_user) ?? org.smtp_user;
                pass = cleanEnv(org.smtp_pass) ?? org.smtp_pass;
                fromEmail = cleanEnv(org.smtp_from_email) ?? org.smtp_from_email;
            }
        }
    }

    // Safety fallback
    if (!host || !user || !pass) {
        console.warn(`[Email Dispatcher] Aborting. Missing SMTP configurations globally or tenant falls back to empty variables.`);
        return { success: false, error: 'SMTP Unconfigured' };
    }

    console.log(
        `[Email Dispatcher] Resolved config: Host: ${host}, Port: ${port}, User: ${user}, From: ${fromEmail}, Pass length: ${pass ? pass.length : 0}`
    );

    const attempts: { port: number; secure: boolean; label: string }[] = [
        { port, secure: port === 465, label: 'primary' },
    ];
    if (port === 465) {
        attempts.push({ port: 587, secure: false, label: '587-fallback' });
    }

    let lastError: Error | null = null;

    for (const attempt of attempts) {
        try {
            const transporter = nodemailer.createTransport({
                host,
                port: attempt.port,
                secure: attempt.secure,
                auth: { user, pass },
                connectionTimeout: 30_000,
                greetingTimeout: 30_000,
                socketTimeout: 30_000,
                requireTLS: !attempt.secure,
                tls: { rejectUnauthorized: false },
            });

            // Scaffold standard styling directly into generic emails
            const emailHTML = options._rawHtmlOverride ? options.html : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: ${brandColor}; margin: 0; font-size: 24px; font-weight: bold;">${brandName}</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); color: #333333;">
                ${options.html}
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
                <p>Powered by AffiliateMango &copy; ${new Date().getFullYear()}</p>
            </div>
        </div>
        `;

            const senderName = brandName === 'AffiliateMango' ? 'AffiliateMango' : `${brandName} Partners`;
            await transporter.sendMail({
                from: `"${senderName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: emailHTML,
            });

            if (attempt.label !== 'primary') {
                console.log(`[Email Dispatcher] Sent via ${attempt.label} on port ${attempt.port}`);
            }
            return { success: true };
        } catch (error: any) {
            lastError = error;
            console.error(
                `[Email Dispatcher] Failed (${attempt.label}, port ${attempt.port}) via ${host}:`,
                error.message
            );
        }
    }

    return { success: false, error: lastError?.message || 'SMTP send failed' };
}
