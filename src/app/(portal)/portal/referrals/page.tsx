import { createClient } from "@/utils/supabase/server";
import { Users, Activity, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 30;

export default async function AffiliateReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*, campaign:campaigns(show_customer_email)')
        .eq('user_id', user.id)
        .single();
        
    if (!affiliate) return null;

    const showEmail = (affiliate.campaign as any)?.show_customer_email === true;

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10));

    // Fetch referrals for this affiliate
    const { data: referrals, error } = await supabase
        .from('referrals')
        .select(`*`)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

    // Fetch all commissions for this affiliate with customer_email for per-referral matching
    const { data: commissions } = await supabase
        .from('commissions')
        .select('id, affiliate_id, referral_id, customer_email, revenue, commission_amount, amount')
        .eq('affiliate_id', affiliate.id);

    // Build lookup maps
    const byReferralId: Record<string, { revenue: number; commission: number }> = {};
    const byAffiliateEmail: Record<string, { revenue: number; commission: number }> = {};

    for (const c of commissions || []) {
        const rev = Number(c.revenue || 0);
        const comm = Number(c.commission_amount || c.amount || 0);

        if (c.referral_id) {
            if (!byReferralId[c.referral_id]) byReferralId[c.referral_id] = { revenue: 0, commission: 0 };
            byReferralId[c.referral_id].revenue += rev;
            byReferralId[c.referral_id].commission += comm;
        }

        if (c.customer_email && c.affiliate_id) {
            const key = `${c.affiliate_id}::${c.customer_email.toLowerCase()}`;
            if (!byAffiliateEmail[key]) byAffiliateEmail[key] = { revenue: 0, commission: 0 };
            byAffiliateEmail[key].revenue += rev;
            byAffiliateEmail[key].commission += comm;
        }
    }

    // Attach per-customer totals to each referral
    const referralsWithRevenue = (referrals || []).map(r => {
        const affiliateId = affiliate.id;
        const email = (r.customer_email || r.referred_email || '').toLowerCase();

        // Try referral_id match first, then email match
        const totals = byReferralId[r.id]
            ?? byAffiliateEmail[`${affiliateId}::${email}`]
            ?? { revenue: 0, commission: 0 };

        return { ...r, revenue: totals.revenue, totalCommission: totals.commission };
    });

    const totalReferrals = referralsWithRevenue?.length || 0;
    const activeReferrals = referralsWithRevenue?.filter(r => r.status === 'active').length || 0;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pagedReferrals = referralsWithRevenue.slice(start, start + PAGE_SIZE);

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Captured Traffic</h2>
                <p className="text-zinc-500 text-sm font-medium">View users who successfully signed up using your routing link.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                             <Users className="w-4 h-4 text-orange-500" /> Total Referred
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                            {totalReferrals}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Active Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                            {activeReferrals}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative mt-6">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Total Revenue</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Commission</th>
                                <th className="px-6 py-4 whitespace-nowrap">Referral Date</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {referralsWithRevenue.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {error ? "Error fetching referrals." : "No captures yet."}
                                    </td>
                                </tr>
                            )}
                            {pagedReferrals.map((ref) => (
                                <tr key={ref.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group border-l-2 border-transparent hover:border-orange-500">
                                    <td className="px-6 py-4 font-mono text-zinc-300 text-sm">
                                        {/* Redact part of the email for privacy in the affiliate portal */}
                                        {(() => {
                                            const raw = ref.customer_email || ref.referred_email || '—';
                                            if (showEmail) return raw;
                                            return raw.replace(/(.{2})(.*)(?=@)/,
                                                (gp1: string, gp2: string, gp3: string) => gp2 + gp3.replace(/./g, '*')
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {ref.revenue > 0 ? (
                                            <span className="text-emerald-400 font-mono font-semibold">
                                                ${ref.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : <span className="text-zinc-600 font-mono">$0.00</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {ref.totalCommission > 0 ? (
                                            <span className="text-amber-400 font-mono font-semibold">
                                                ${ref.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : <span className="text-zinc-600 font-mono">$0.00</span>}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                                        {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                            ${ref.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                            {ref.status || 'unknown'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination totalCount={totalReferrals} pageSize={PAGE_SIZE} currentPage={currentPage} />
            </div>
        </div>
    );
}
