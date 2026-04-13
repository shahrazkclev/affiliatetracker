import { createClient, getResolvedOrgId } from "@/utils/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, MousePointerClick, Users, Wallet, Link as LinkIcon, Activity } from "lucide-react";
import { PortalLinkGenerator } from "@/components/PortalLinkGenerator";
import { redirect } from "next/navigation";

export default async function PortalHome() {
    const supabase = await createClient();
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get signed-in user
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in → send to login
    if (!user) {
        redirect("/login");
    }

    // Identify which Organization Portal is being accessed
    const orgId = await getResolvedOrgId();

    if (!orgId) {
        redirect("/login?message=Organization not found.");
    }

    // Find affiliate record for this user scoped to THIS specific organization
    const { data: affiliate } = await admin
        .from('affiliates')
        .select('*, campaign:campaigns(name, landing_url), org:organizations(custom_domain)')
        .eq('email', user?.email ?? '')
        .eq('org_id', orgId)
        .maybeSingle();

    // Commissions for this affiliate
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, revenue, status, sub_id, created_at')
        .eq('affiliate_id', affiliate?.id ?? '')
        .order('created_at', { ascending: false });

    // Payouts for this affiliate (to determine which commissions are settled)
    const { data: payouts } = await supabase
        .from('payouts')
        .select('amount, created_at')
        .eq('affiliate_id', affiliate?.id ?? '')
        .order('created_at', { ascending: true });

    // Referrals for this affiliate
    const { data: referrals } = await supabase
        .from('referrals')
        .select('id, status, sub_id, created_at')
        .eq('affiliate_id', affiliate?.id ?? '');

    // Clicks grouped by tag
    const { data: clickEvents } = await supabase
        .from('click_events')
        .select('sub_id')
        .eq('affiliate_id', affiliate?.id ?? '');

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

    // Compute stats
    const totalCommission = (commissions || []).reduce((s, c) => s + Number(c.amount), 0);
    const totalPaid = (payouts || []).reduce((s, p) => s + Number(p.amount), 0);
    const unpaidCommission = Math.max(0, totalCommission - totalPaid);
    const totalClicks = affiliate?.clicks || 0;
    const payingReferrals = (referrals || []).filter(r => r.status === 'active').length;

    const refCode = affiliate?.referral_code || '';
    const campaignLandingUrl = (affiliate?.campaign as any)?.landing_url || null;
    const orgDomain = (affiliate?.org as any)?.custom_domain;
    const baseUrl = campaignLandingUrl
        ? `${campaignLandingUrl}${campaignLandingUrl.includes('?') ? '&' : '?'}via=${refCode}`
        : orgDomain 
            ? `https://${orgDomain}?via=${refCode}`
            : `https://affiliatemango.com/pricing?via=${refCode}`;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
                        Welcome, {affiliate?.name?.split(' ')[0] || 'Affiliate'}
                    </h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-orange-500/50 pl-2 ml-1 mt-1">
                        {affiliate?.campaign?.name ? `Campaign: ${affiliate.campaign.name}` : 'Your affiliate dashboard'}
                    </p>
                </div>
            </div>

            {/* Link Generator */}
            <PortalLinkGenerator 
                baseUrl={baseUrl} 
                refCode={refCode} 
                affiliateId={affiliate?.id || ''} 
                clickCounts={clickCounts}
                tagAnalytics={tagAnalytics}
                initialLinks={affiliate?.custom_tracking_links || []}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Commission", value: `$${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-amber-400", shadow: "drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" },
                    { title: "Unpaid Balance", value: `$${unpaidCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Wallet, color: unpaidCommission > 0 ? "text-emerald-400" : "text-zinc-400" },
                    { title: "Total Clicks", value: totalClicks.toString(), icon: MousePointerClick, color: "text-zinc-100" },
                    { title: "Active Referrals", value: payingReferrals.toString(), icon: Users, color: "text-zinc-100" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-zinc-800/50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-4 relative">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{stat.title}</h4>
                                <stat.icon className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                            </div>
                            <div className={`text-3xl font-bold font-mono tracking-tight ${stat.color} ${stat.shadow || ''}`}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Commissions */}
            {commissions && commissions.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader className="border-b border-zinc-800/50 pb-3">
                        <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Recent Commissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {commissions.slice(0, 8).map((c, i) => {
                                    const payoutDates = (payouts || []).map(p => new Date(p.created_at));
                                    const isPaid = payoutDates.some(pd => pd >= new Date(c.created_at));
                                    return (
                                        <tr key={i} className="hover:bg-zinc-800/20">
                                            <td className="px-4 py-2 text-zinc-400 font-mono text-xs">
                                                {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-emerald-400 font-semibold">
                                                ${Number(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium
                                                    ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                    {isPaid ? 'paid' : 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
