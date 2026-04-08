import { DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { CommissionsFilterTabs } from "./CommissionsFilterTabs";
import { CommissionsTable } from "./CommissionsSearch";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";
import { AddCommissionButton } from "./AddCommissionButton";

const PAGE_SIZE = 25;

export default async function CommissionsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; page?: string; q?: string }>
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user?.id || '').single();
    if (!org) return <div className="p-8 text-red-500">Organization not found.</div>;
    const orgId = org.id;

    const params = await searchParams;
    const activeFilter = params.status || 'all';
    const currentPage = Math.max(1, parseInt(params.page || '1', 10));
    const searchQuery = (params.q || '').trim();

    const { data: affiliatesList } = await supabase.from('affiliates').select('id, name, email').eq('org_id', orgId).order('name');

    // ── Fetch ALL commissions to calculate global accurate stats ─────────────────────────────
    const { data: allCommissions } = await supabase
        .from('commissions')
        .select(`*, affiliate:affiliates(name, email, campaign:campaigns(name))`)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    // ── Payout enrichment (for effectiveStatus) ──────────────────────────────
    const { data: payouts } = await supabase
        .from('payouts')
        .select('affiliate_id, created_at')
        .in('affiliate_id', (affiliatesList || []).map(a => a.id))
        .order('created_at', { ascending: true });

    const payoutMap: Record<string, Date[]> = {};
    for (const p of payouts || []) {
        if (!payoutMap[p.affiliate_id]) payoutMap[p.affiliate_id] = [];
        payoutMap[p.affiliate_id].push(new Date(p.created_at));
    }

    const commissionsWithStatus = (allCommissions || []).map(c => {
        const dates = payoutMap[c.affiliate_id] || [];
        const commDate = new Date(c.created_at);
        const settled = dates.some(pd => pd >= commDate);
        return { ...c, effectiveStatus: settled ? 'paid' : (c.status || 'pending') };
    });

    // ── Global Stats Calculation ─────────────────────────────
    const totalVolume = commissionsWithStatus.reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingCount = commissionsWithStatus.filter(c => c.effectiveStatus === 'pending').length;
    const completedCount = commissionsWithStatus.filter(c => c.effectiveStatus === 'paid' || c.effectiveStatus === 'completed').length;

    const tabCounts = {
        all: commissionsWithStatus.length,
        pending: pendingCount,
        paid: completedCount,
    };

    // ── In-Memory Filtering ─────────────────────────────
    let filteredList = commissionsWithStatus;

    if (activeFilter !== 'all') {
        if (activeFilter === 'paid') {
            filteredList = filteredList.filter(c => c.effectiveStatus === 'paid' || c.effectiveStatus === 'completed');
        } else if (activeFilter === 'pending') {
            filteredList = filteredList.filter(c => c.effectiveStatus === 'pending');
        } else {
            filteredList = filteredList.filter(c => c.effectiveStatus === activeFilter);
        }
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredList = filteredList.filter(c => {
            const eml = c.customer_email?.toLowerCase() || '';
            const affName = c.affiliate?.name?.toLowerCase() || '';
            const affEmail = c.affiliate?.email?.toLowerCase() || '';
            return eml.includes(q) || affName.includes(q) || affEmail.includes(q);
        });
    }

    const totalFiltered = filteredList.length;

    // Pagination
    const start = (currentPage - 1) * PAGE_SIZE;
    const paginatedCommissions = filteredList.slice(start, start + PAGE_SIZE);

    const filterBar = (
        <Suspense fallback={null}>
            <CommissionsFilterTabs active={activeFilter} counts={tabCounts} />
        </Suspense>
    );

    return (
        <div className="space-y-6 max-w-7xl font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Commissions</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-emerald-500/50 pl-2 ml-1 mt-1">All commission records</p>
                    </div>
                </div>
                <AddCommissionButton affiliates={affiliatesList || []} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Total Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" /> Pending Count
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-400 font-mono tracking-tight">
                            {pendingCount} <span className="text-sm text-zinc-500 uppercase tracking-widest font-sans">Transactions</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cleared Count
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
                            {completedCount} <span className="text-sm text-zinc-500 uppercase tracking-widest font-sans">Transactions</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Client component renders search input + table */}
            <CommissionsTable
                commissions={paginatedCommissions}
                filterBar={filterBar}
                initialQuery={searchQuery}
            />

            <Suspense fallback={null}>
                <Pagination totalCount={totalFiltered ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
            </Suspense>
        </div>
    );
}
