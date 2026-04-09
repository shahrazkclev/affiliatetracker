import { Download, History, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { PayoutHistoryTable } from "./PayoutHistoryTable";
import { ExportCsvButton } from "@/components/ExportCsvButton";


const PAGE_SIZE = 25;
export const dynamic = 'force-dynamic';

export default async function PayoutHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
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

    // If searching, find matching affiliate IDs first
    let affiliateIdFilter: string[] | null = null;
    if (searchQuery) {
        const { data: matched } = await supabase
            .from("affiliates")
            .select("id")
            .eq("org_id", orgId)
            .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        affiliateIdFilter = (matched || []).map((a) => a.id);
    }

    let query = supabase
        .from("payouts")
        .select("id, amount, currency, notes, created_at, period, affiliate_id", { count: "exact" })
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

    if (searchQuery) {
        const conditions: string[] = [`notes.ilike.%${searchQuery}%`];
        if (affiliateIdFilter && affiliateIdFilter.length > 0) {
            conditions.push(`affiliate_id.in.(${affiliateIdFilter.join(",")})`);
        }
        query = query.or(conditions.join(","));
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const { data: payouts, count: totalFiltered } = await query.range(start, start + PAGE_SIZE - 1);

    // Summary totals always from unfiltered table
    const { data: allPayouts } = await supabase.from("payouts").select("amount").eq("org_id", orgId);
    const totalPaid = allPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const payoutCount = allPayouts?.length || 0;

    // Affiliate lookup map
    const { data: affiliates } = await supabase
        .from("affiliates")
        .select("id, name, email, payout_email")
        .eq("org_id", orgId);
    const affiliateMap: Record<string, { name: string; email: string; payout_email: string }> = {};
    for (const a of affiliates || []) affiliateMap[a.id] = a;

    return (
        <div className="space-y-6 w-full max-w-full font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <History className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Payout History</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-zinc-600 pl-2 ml-1 mt-1">Archived disbursement records</p>
                    </div>
                </div>
            </div>

            {/* Stripe fee notice — payouts page only */}
            <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3 text-xs text-amber-400/80">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" /></svg>
                <span>Payouts are subject to a <strong className="text-amber-400 font-semibold">3.5% Stripe transfer fee</strong> deducted from gross commission. Example: if you earn $100.00, you receive <strong className="text-amber-400 font-semibold">$96.50 net</strong>.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Total Historical Disbursements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <ReceiptText className="w-4 h-4 text-zinc-500" /> Total Payouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
                            {payoutCount} <span className="text-sm text-zinc-500 uppercase tracking-widest font-sans">Payouts Logged</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Export row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />
                <Suspense fallback={null}>
                    <AdminSearchBar
                        initialQuery={searchQuery}
                        placeholder="Search by affiliate, email, or notes..."
                        accentColor="zinc"
                    />
                </Suspense>
                <ExportCsvButton
                    href={`/api/admin/export/payouts${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                />

            </div>

            <PayoutHistoryTable
                payouts={payouts || []}
                affiliateMap={affiliateMap}
                searchQuery={searchQuery}
            />

            <Suspense fallback={null}>
                <Pagination totalCount={totalFiltered ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
            </Suspense>
        </div>
    );
}
