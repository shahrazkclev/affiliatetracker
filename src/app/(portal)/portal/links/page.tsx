import { createClient, getResolvedOrgId } from "@/utils/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PortalLinkGenerator } from "@/components/PortalLinkGenerator";
import { Link as LinkIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function PortalLinksPage() {
    const supabase = await createClient();
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const orgId = await getResolvedOrgId();

    if (!orgId) {
        redirect("/login?message=Organization not found.");
    }

    const { data: affiliate } = await admin
        .from('affiliates')
        .select('*, campaign:campaigns(name, landing_url), org:organizations(custom_domain)')
        .eq('email', user?.email ?? '')
        .eq('org_id', orgId)
        .maybeSingle();

    if (!affiliate) return null;

    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, revenue, status, sub_id')
        .eq('affiliate_id', affiliate.id);

    const { data: referrals } = await supabase
        .from('referrals')
        .select('id, status, sub_id')
        .eq('affiliate_id', affiliate.id);

    const { data: clickEvents } = await supabase
        .from('click_events')
        .select('sub_id')
        .eq('affiliate_id', affiliate.id);

    const clickCounts: Record<string, number> = {};
    for (const c of clickEvents || []) {
        if (!c.sub_id) continue;
        const tag = c.sub_id.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
        clickCounts[tag] = (clickCounts[tag] || 0) + 1;
    }

    const tagAnalytics: Record<string, { referrals: number; revenue: number; commissions: number }> = {};
    
    for (const r of referrals || []) {
        if (!r.sub_id) continue;
        const tag = r.sub_id.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
        if (!tagAnalytics[tag]) tagAnalytics[tag] = { referrals: 0, revenue: 0, commissions: 0 };
        tagAnalytics[tag].referrals += 1;
    }

    for (const c of commissions || []) {
        if (!c.sub_id) continue;
        const tag = c.sub_id.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
        if (!tagAnalytics[tag]) tagAnalytics[tag] = { referrals: 0, revenue: 0, commissions: 0 };
        tagAnalytics[tag].revenue += Number(c.revenue || 0);
        tagAnalytics[tag].commissions += Number(c.amount || 0);
    }

    const refCode = affiliate.referral_code || '';
    const campaignLandingUrl = (affiliate.campaign as any)?.landing_url || null;
    const orgDomain = (affiliate.org as any)?.custom_domain;
    const baseUrl = campaignLandingUrl
        ? `${campaignLandingUrl}${campaignLandingUrl.includes('?') ? '&' : '?'}via=${refCode}`
        : orgDomain 
            ? `https://${orgDomain}?via=${refCode}`
            : `https://affiliatemango.com/pricing?via=${refCode}`;

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight flex items-center gap-2">
                    Custom Tracking Links
                </h2>
                <p className="text-zinc-500 text-sm font-medium">Generate specific tags to map your traffic and analyze performance per source.</p>
            </div>

            <PortalLinkGenerator 
                baseUrl={baseUrl} 
                refCode={refCode} 
                affiliateId={affiliate.id} 
                clickCounts={clickCounts}
                tagAnalytics={tagAnalytics}
                initialLinks={affiliate.custom_tracking_links || []}
            />
        </div>
    );
}
