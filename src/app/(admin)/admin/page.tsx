import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { CopyButton } from "@/components/CopyButton";
import { Activity, Target, Users, DollarSign, Network, GitMerge, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AffiliateQuickViewButton } from "@/app/(admin)/admin/referrals/AffiliateQuickViewButton";
import { AffiliateActionsCell } from "@/app/(admin)/admin/affiliates/AffiliateActionsCell";
import { AdminSetupChecklist } from "./AdminSetupChecklist";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_webhook_id, custom_domain')
    .eq('owner_id', user?.id || 'NO_USER')
    .limit(1)
    .maybeSingle();

  const orgId = org?.id;

  if (!orgId) {
      return (
          <div className="flex h-full items-center justify-center p-8">
              <div className="bg-zinc-900 border border-red-500/30 text-amber-500/80 px-6 py-4 rounded-xl shadow-xl max-w-md text-center text-sm font-mono tracking-wide">
                  Organization configuration missing or unauthorized. Please verify your platform status.
              </div>
          </div>
      );
  }

  const portalUrl = org?.custom_domain ? `https://${org.custom_domain}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://affiliatemango.com");

  // Fetch real aggregated data
  const { count: affiliatesCount } = await supabase
    .from('affiliates')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const { data: stats } = await supabase
    .from('affiliates')
    .select('clicks, total_commission')
    .eq('org_id', orgId);

  const totalClicks = stats?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;
  const totalCommissions = stats?.reduce((acc, curr) => acc + Number(curr.total_commission || 0), 0) || 0;
  const estimatedRevenue = totalCommissions * 3.33;

  const { data: campaigns } = await supabase.from("campaigns").select("*").eq('org_id', orgId);

  // Recent referrals (actually recent sales/commissions) mapped to precise events
  const { data: recentCommissions } = await supabase
    .from("commissions")
    .select("id, amount, revenue, status, affiliate_id, created_at, customer_email, referral:referrals(customer_email)")
    .eq('org_id', orgId)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentAffIds = [...new Set((recentCommissions || []).map((c: any) => c.affiliate_id).filter(Boolean))];
  const { data: recentAffiliates } = recentAffIds.length > 0
    ? await supabase.from("affiliates").select("*").in("id", recentAffIds)
    : { data: [] };

  const recentAffMap: Record<string, any> = {};
  for (const a of recentAffiliates || []) recentAffMap[a.id] = a;

  // Track settlements to know if these are "paid" or "pending" dynamically
  const { data: recentPayouts } = await supabase.from("payouts").select("affiliate_id, created_at").eq("org_id", orgId);
  const payoutMap: Record<string, Date[]> = {};
  for (const p of recentPayouts || []) {
      if (!payoutMap[p.affiliate_id]) payoutMap[p.affiliate_id] = [];
      payoutMap[p.affiliate_id].push(new Date(p.created_at));
  }

  const recentReferrals = (recentCommissions || []).map((c: any) => {
    let email = c.customer_email;
    if (!email && c.referral && !Array.isArray(c.referral)) {
        email = c.referral.customer_email || "Unknown";
    }

    const dates = payoutMap[c.affiliate_id] || [];
    const commDate = new Date(c.created_at);
    const settled = dates.some(pd => pd >= commDate);
    const effectiveStatus = settled ? 'paid' : (c.status || 'pending');

    return {
      id: c.id,
      customer_email: email,
      status: effectiveStatus,
      totalRevenue: Number(c.revenue || 0),
      totalCommission: Number(c.amount || 0),
      affiliate: c.affiliate_id ? recentAffMap[c.affiliate_id] ?? null : null,
      created_at: c.created_at
    };
  });

  return (
    <div className="space-y-6 w-full max-w-full font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-400 font-medium">System overview & performance metrics</p>
        </div>
      </div>

      <AdminSetupChecklist 
        hasCampaign={!!(campaigns && campaigns.length > 0)}
        hasAffiliate={!!(affiliatesCount && affiliatesCount > 0)}
        hasClicks={totalClicks > 0}
        hasStripe={!!org?.stripe_webhook_id}
      />

      {/* Geometry Nodes Vibe: Cards have solid dark backgrounds, subtle neon top borders, smooth hover scales */}
      <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:border-zinc-700">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-amber-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="pb-3 border-b border-zinc-800/50">
          <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
            Affiliate Portal Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center text-zinc-300 font-mono text-sm w-full shadow-inner">
              {portalUrl}
            </div>
            <CopyButton
              text={portalUrl}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Node 1: Revenue */}
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl transition-all duration-300 hover:border-zinc-700 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors duration-300" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Revenue Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-zinc-50 tracking-tight">
              ${estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Node 2: Clicks */}
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl transition-all duration-300 hover:border-zinc-700 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500/20 group-hover:bg-orange-500/80 transition-colors duration-300" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" /> Network Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-zinc-50 tracking-tight">
              {totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Node 3: Affiliates */}
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl transition-all duration-300 hover:border-zinc-700 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors duration-300" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Connected Affiliates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-zinc-50 tracking-tight">
              {affiliatesCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 h-72 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="border-b border-zinc-800/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Revenue Graph</CardTitle>
              <select className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-1.5 rounded-md text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer hover:bg-zinc-800">
                <option>Lifetime Matrix</option>
              </select>
            </div>
            <div className="text-xl font-bold text-zinc-100 mt-2 flex items-center gap-2">
              ${estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-amber-400 text-xs font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">+12.5%</span>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            {/* Simulated Blender-style graph line */}
            <div className="w-full h-full relative flex items-end opacity-50 group-hover:opacity-100 transition-opacity duration-500">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 L20,60 L40,70 L60,30 L80,45 L100,10" fill="none" stroke="#fbbf24" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                <path d="M0,80 L20,60 L40,70 L60,30 L80,45 L100,10 L100,100 L0,100 Z" fill="url(#amber-gradient)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="amber-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 h-72 relative overflow-hidden">
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="border-b border-zinc-800/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Commission Output</CardTitle>
              <select className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-1.5 rounded-md text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer hover:bg-zinc-800">
                <option>Lifetime Matrix</option>
              </select>
            </div>
            <div className="text-xl font-bold text-zinc-100 mt-2 flex items-center gap-2">
              ${totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-amber-400 text-xs font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            {/* Simulated Blender-style graph line */}
            <div className="w-full h-full relative flex items-end opacity-50 group-hover:opacity-100 transition-opacity duration-500">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,90 L25,65 L50,80 L75,40 L100,50" fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                <path d="M0,90 L25,65 L50,80 L75,40 L100,50 L100,100 L0,100 Z" fill="url(#amber-gradient)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="amber-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Referrals */}
      <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/50 via-amber-400/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="border-b border-zinc-800/50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-amber-400" /> Recent Referrals
          </CardTitle>
          <Link
            href="/admin/referrals"
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {!recentReferrals || recentReferrals.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">No referrals yet.</p>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {recentReferrals.map((ref) => {
                const aff = ref.affiliate as any;
                const email = ref.customer_email || "—";
                return (
                    <div key={ref.id} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-800/20 transition-colors group/row">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          ref.status === "active" ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-zinc-600"
                        }`} />
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-zinc-300 truncate">{email}</p>
                          {aff ? (
                            <AffiliateQuickViewButton affiliate={aff} compact campaigns={campaigns || []} />
                          ) : (
                            <p className="text-[11px] text-zinc-500 truncate">via Unknown</p>
                          )}

                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="flex flex-col items-end border-r border-zinc-800/50 pr-4">
                          <span className="text-[11px] font-semibold text-emerald-400/90 font-mono tracking-wide">
                            ${(ref.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Revenue
                          </span>
                          <span className="text-[10px] text-amber-500/80 font-mono font-medium tracking-wide">
                            ${(ref.totalCommission || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Commission
                          </span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider border ${
                          ref.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}>{ref.status === 'active' ? 'paid' : (ref.status || "unknown")}</span>
                        <span className="text-[11px] text-zinc-600 font-mono whitespace-nowrap">
                          {new Date(ref.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                        {aff && (
                          <div className="ml-2 inline-block">
                            <AffiliateActionsCell affiliate={aff} campaigns={campaigns || []} />
                          </div>
                        )}
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
