import { GitMerge, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportCsvButton } from "@/components/ExportCsvButton";

import { AdminSearchBar } from "@/components/AdminSearchBar";
import { createClient } from "@/utils/supabase/server";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";
import { StatusFilter } from "./StatusFilter";
import { AffiliateQuickViewButton } from "./AffiliateQuickViewButton";
import { AffiliateActionsCell } from "@/app/(admin)/admin/affiliates/AffiliateActionsCell";
import { AddManualReferralModal } from "./AddManualReferralModal";

const PAGE_SIZE = 25;

export default async function ReferralsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: teamMembership } = await supabase.from('team_members').select('org_id').eq('user_id', user?.id || '').single();
    const org = teamMembership ? { id: teamMembership.org_id } : null;
    if (!org) return <div className="p-8 text-red-500">Organization not found.</div>;
    const orgId = org.id;

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || "1", 10));
    const searchQuery = (params.q || "").trim();
    const statusFilter = params.status || "all";

    // Fetch global datasets for in-memory status resolution
    const [
        { data: affiliatesData },
        { data: allCommissions },
        { data: allPayouts }
    ] = await Promise.all([
        supabase.from("affiliates").select("*").eq("org_id", orgId).limit(5000),
        supabase.from("commissions").select("id, amount, revenue, status, affiliate_id, created_at, referral_id, referral:referrals(customer_email)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(10000),
        supabase.from("payouts").select("affiliate_id, created_at").eq("org_id", orgId).limit(10000)
    ]);

    const affMap: Record<string, any> = {};
    for (const a of affiliatesData || []) affMap[a.id] = a;

    // Precompute payout mappings
    const payoutMap: Record<string, Date[]> = {};
    for (const p of allPayouts || []) {
        if (!payoutMap[p.affiliate_id]) payoutMap[p.affiliate_id] = [];
        payoutMap[p.affiliate_id].push(new Date(p.created_at));
    }

    // Resolve dynamic statuses for ALL specific sales (mapped as referral records)
    let processedReferrals = (allCommissions || []).map((c: any) => {
        const dates = payoutMap[c.affiliate_id] || [];
        const commDate = new Date(c.created_at);
        const settled = dates.some(pd => pd >= commDate);
        const effectiveStatus = settled ? 'paid' : (c.status || 'pending');

        let customerEmail = "Unknown";
        if (c.referral && !Array.isArray(c.referral)) {
            customerEmail = c.referral.customer_email || "Unknown";
        }

        return {
            id: c.id,
            customer_email: customerEmail,
            status: effectiveStatus,
            affiliate: c.affiliate_id ? affMap[c.affiliate_id] ?? null : null,
            totalCommission: Number(c.amount || 0),
            totalRevenue: Number(c.revenue || 0),
            created_at: c.created_at
        };
    });

    // Capture tab counts explicitly against the fully resolved statuses
    const tabCounts = {
        all: processedReferrals.length,
        paid: processedReferrals.filter(r => r.status === 'paid').length,
        pending: processedReferrals.filter(r => r.status === 'pending').length,
    };

    // Filter by Status Tab
    if (statusFilter !== "all") {
        processedReferrals = processedReferrals.filter(r => r.status === statusFilter);
    }

    // Filter by Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        processedReferrals = processedReferrals.filter(r => {
            return (
                r.customer_email?.toLowerCase().includes(q) ||
                r.affiliate?.name?.toLowerCase().includes(q) ||
                r.affiliate?.email?.toLowerCase().includes(q)
            );
        });
    }

    const filteredCount = processedReferrals.length;
    const displayTotal = filteredCount;

    // Slice for Pagination
    const start = (currentPage - 1) * PAGE_SIZE;
    const referrals = processedReferrals.slice(start, start + PAGE_SIZE);

    // Step 4: Fetch campaigns for the Actions cell
    const { data: campaigns } = await supabase.from('campaigns').select('*').eq('org_id', orgId);

    // Step 5: Fetch all affiliates for the manual referral dropdown
    const allAffiliates = affiliatesData || [];


    return (
        <div className="space-y-6 w-full max-w-full font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <GitMerge className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Referrals</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-amber-500/50 pl-2 ml-1 mt-1">
                            All referral records tracked by your affiliates
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-500" /> Total Referrals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            {tabCounts.all ?? 0}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Paid
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                            {tabCounts.paid ?? 0}{" "}
                            <span className="text-sm font-sans tracking-widest text-zinc-500 uppercase">Referrals</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Status filter + Export */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="w-full sm:w-[360px]">
                        <AdminSearchBar
                            placeholder="Search by email, affiliate, or Stripe ID…"
                            accentColor="amber"
                        />
                    </div>
                    <Suspense fallback={null}>
                        <StatusFilter activeStatus={statusFilter} counts={tabCounts} />
                    </Suspense>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                    <AddManualReferralModal affiliates={allAffiliates || []} />
                    <ExportCsvButton
                        href={`/api/admin/export/referrals?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), ...(statusFilter !== 'all' ? { status: statusFilter } : {}) }).toString()}`}
                        accentColor="amber"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Customer Email</th>
                                <th className="px-6 py-4 whitespace-nowrap">Referred By</th>
                                <th className="px-6 py-4 whitespace-nowrap">Total Revenue</th>
                                <th className="px-6 py-4 whitespace-nowrap">Commission</th>
                                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {(referrals ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {searchQuery
                                            ? `No referrals matching "${searchQuery}".`
                                            : "No referrals yet."}
                                    </td>
                                </tr>
                            )}
                            {(referrals ?? []).map((ref) => {
                                const email = ref.customer_email || "—";
                                const aff = ref.affiliate as any;
                                return (
                                    <tr
                                        key={ref.id}
                                        className="hover:bg-zinc-800/30 transition-colors duration-200 group border-l-2 border-transparent hover:border-amber-500"
                                    >
                                        <td className="px-6 py-4 font-mono text-zinc-300 text-sm">{email}</td>
                                        <td className="px-6 py-4">
                                            {aff ? (
                                                <AffiliateQuickViewButton affiliate={aff} campaigns={campaigns || []} />
                                            ) : (
                                                <span className="text-zinc-600 text-xs">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-300 text-sm">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(ref.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-emerald-400 text-sm">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(ref.totalCommission)}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                                            {new Date(ref.created_at).toLocaleDateString("en-US", {
                                                month: "short", day: "2-digit", year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                                ref.status === "paid"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : ref.status === "pending"
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                            }`}>
                                                {ref.status === 'active' ? 'paid' : (ref.status || "unknown")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {aff && (
                                                <div className="inline-block">
                                                    <AffiliateActionsCell affiliate={aff} campaigns={campaigns || []} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
