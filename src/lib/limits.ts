import { createClient as createAdminClient } from '@supabase/supabase-js';
import { dispatchEmail } from './email';

export async function verifyAndPromptRevenueUpgrade(orgId: string) {
    if (!orgId) return;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) return;

    const admin = createAdminClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Fetch current revenue limits and tracked revenue
        const { data: org } = await admin
            .from('organizations')
            .select(`
                name,
                upgrade_prompted_at,
                team_members ( user_id ),
                saas_plans ( max_revenue )
            `)
            .eq('id', orgId)
            .single();

        if (!org) return;

        const maxRevenue = Array.isArray(org.saas_plans) ? org.saas_plans[0]?.max_revenue : (org.saas_plans as any)?.max_revenue;
        // If maxRevenue is null/undefined, plan is unmetered (Scale)
        if (maxRevenue === null || maxRevenue === undefined) return;

        // If we recently prompted (e.g. within 30 days), skip to avoid spamming
        if (org.upgrade_prompted_at) {
            const promptDate = new Date(org.upgrade_prompted_at);
            const daysSincePrompt = (Date.now() - promptDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSincePrompt < 30) return;
        }

        // 2. Compute current 30-day tracked revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: commissions } = await admin
            .from('commissions')
            .select('revenue')
            .eq('org_id', orgId)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .neq('status', 'void');
            
        const currentRevenue = (commissions || []).reduce((acc, comm) => acc + (Number(comm.revenue) || 0), 0);

        if (currentRevenue >= maxRevenue) {
            console.log(`[Limits] Org ${orgId} has reached revenue limit: ${currentRevenue} / ${maxRevenue}`);
            
            // 3. Mark as prompted so we don't spam them on every webhook iteration
            await admin
                .from('organizations')
                .update({ upgrade_prompted_at: new Date().toISOString() })
                .eq('id', orgId);

            // 4. Send email to users in team_members
            const { data: usersData, error: usersError } = await admin.auth.admin.listUsers();
            if (usersError || !usersData?.users) return;

            const orgUserIds = (org.team_members || []).map((tm: any) => tm.user_id);
            const orgAdminUsers = usersData.users.filter((u: any) => orgUserIds.includes(u.id));

            for (const user of orgAdminUsers) {
                if (!user.email) continue;
                await dispatchEmail(null, { // Dispatch from global sender, not their own SMTP!
                    to: user.email,
                    subject: `Action Required: Affiliate Revenue Limit Reached`,
                    html: `
                        <p>Hi there,</p>
                        <p>Your affiliate campaigns on <strong>${org.name || 'your platform'}</strong> are performing incredibly well! However, you have exceeded your SaaS plan's tracked affiliate revenue limit of <strong>$${maxRevenue.toLocaleString()}/mo</strong>.</p>
                        <p>We are still tracking your current campaigns indefinitely to ensure your live business and affiliates are not affected! 🚀</p>
                        <p>To avoid service interruptions for newly referred traffic, please upgrade your plan to continue scaling with AffiliateMango.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://affiliatemango.com'}/admin/billing" style="background-color: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade to Next Tier</a>
                        </div>
                        <p>Best,<br>The AffiliateMango Team</p>
                    `
                });
            }
        }
    } catch (e) {
        console.error('[verifyAndPromptRevenueUpgrade] Error', e);
    }
}
