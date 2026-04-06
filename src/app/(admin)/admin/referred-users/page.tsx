import { Users, Activity, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { createClient } from "@/utils/supabase/server";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { AffiliateActionsCell } from "@/app/(admin)/admin/affiliates/AffiliateActionsCell";


const PAGE_SIZE = 30;

export default async function ReferredUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10));
    const searchQuery = (params.q || '').trim();

    // Summary counts — always unfiltered
    const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

    const { count: activeReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    // Server-side search: if query, find matching affiliate IDs first
    let affiliateIds: string[] | null = null;
    if (searchQuery) {
        const { data: matchingAffiliates } = await supabase
            .from('affiliates')
            .select('id')
            .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        affiliateIds = matchingAffiliates?.map((a) => a.id) ?? [];
    }

    // Build the query with optional search
    let query = supabase
        .from('referrals')
        .select(`*, affiliate:affiliates(*)`, { count: 'exact' })
        .order('created_at', { ascending: false });

    if (searchQuery) {
        const orClauses = [
            `customer_email.ilike.%${searchQuery}%`,
            `referred_email.ilike.%${searchQuery}%`,
        ];
        if (affiliateIds && affiliateIds.length > 0) {
            orClauses.push(`affiliate_id.in.(${affiliateIds.join(',')})`);
        }
        query = query.or(orClauses.join(','));
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    query = query.range(start, start + PAGE_SIZE - 1);

    const { data: referrals, error, count: filteredCount } = await query;

    const { data: campaigns } = await supabase.from('campaigns').select('*');

    // Fetch commissions for revenue/commission matching
    const { data: commissions } = await supabase
        .from('commissions')
        .select('id, affiliate_id, referral_id, customer_email, revenue, commission_amount, amount');

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

    const pagedReferrals = (referrals || []).map((r) => {
        const affiliateId = (r.affiliate as any)?.id;
        const email = (r.customer_email || r.referred_email || '').toLowerCase();
        const totals =
            byReferralId[r.id] ??
            byAffiliateEmail[`${affiliateId}::${email}`] ??
            { revenue: 0, commission: 0 };
        return { ...r, revenue: totals.revenue, totalCommission: totals.commission };
    });

    const displayTotal = searchQuery ? (filteredCount ?? 0) : (totalReferrals ?? 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <Network className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Referred Users</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-indigo-500/50 pl-2 ml-1 mt-1">
                            Signups attributed to your affiliates
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary cards — always show global totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> Total Referred
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                            {totalReferrals ?? 0}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Active Retention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                            {activeReferrals ?? 0}{' '}
                            <span className="text-sm font-sans tracking-widest text-zinc-500 uppercase">Users</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search bar + Export */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
                <div className="w-full md:w-[400px]">
                    <AdminSearchBar
                        placeholder="Search by email or affiliate name…"
                        accentColor="indigo"
                    />
                </div>
                <ExportCsvButton
                    href={`/api/admin/export/referred-users${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                    accentColor="indigo"
                />

            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                                <th className="px-6 py-4 whitespace-nowrap">Referred By</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Total Revenue</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Commission</th>
                                <th className="px-6 py-4 whitespace-nowrap">Referral Date</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {pagedReferrals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {error
                                            ? 'Error fetching referrals.'
                                            : searchQuery
                                            ? `No referred users matching "${searchQuery}".`
                                            : 'No referred users yet.'}
                                    </td>
                                </tr>
                            )}
                            {pagedReferrals.map((ref) => (
                                <tr
                                    key={ref.id}
                                    className="hover:bg-zinc-800/30 transition-colors duration-200 group border-l-2 border-transparent hover:border-indigo-500"
                                >
                                    <td className="px-6 py-4 font-mono text-zinc-300 text-sm">
                                        {ref.customer_email || ref.referred_email || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200">{(ref.affiliate as any)?.name || 'Unknown'}</div>
                                        <div className="text-zinc-500 text-xs font-mono mt-0.5">{(ref.affiliate as any)?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {ref.revenue > 0 ? (
                                            <span className="text-emerald-400 font-mono font-semibold drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]">
                                                ${ref.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600 font-mono">$0.00</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {ref.totalCommission > 0 ? (
                                            <span className="text-amber-400 font-mono font-semibold">
                                                ${ref.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600 font-mono">$0.00</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                                        {new Date(ref.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: '2-digit', year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                            ref.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                        }`}>
                                            {ref.status === 'active' ? 'paid' : (ref.status || 'unknown')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {ref.affiliate && (
                                            <AffiliateActionsCell affiliate={ref.affiliate} campaigns={campaigns || []} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Suspense fallback={null}>
                    <Pagination totalCount={displayTotal} pageSize={PAGE_SIZE} currentPage={currentPage} />
                </Suspense>
            </div>
        </div>
    );
}
