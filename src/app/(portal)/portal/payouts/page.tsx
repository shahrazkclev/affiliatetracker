import { createClient, getResolvedOrgId, getActiveAffiliateProfile } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ClockIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { PortalPayoutActions } from "./PortalPayoutActions";
import { Pagination } from "@/components/Pagination";
import { Suspense } from "react";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;

export default async function AffiliatePayoutsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const supabase = await createClient();
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const orgId = await getResolvedOrgId();
    if (!orgId) redirect("/login");

    const affiliate = await getActiveAffiliateProfile(orgId, user.email || '');
    if (!affiliate) redirect("/portal");

    // All payouts this affiliate has received
    const { data: payouts } = await supabase
        .from('payouts')
        .select('id, amount, currency, notes, created_at, period')
        .eq('affiliate_id', affiliate?.id ?? '')
        .order('created_at', { ascending: false });

    // All pending payout requests they've made
    const { data: requests } = await supabase
        .from('payout_requests')
        .select('id, amount, status, message, created_at')
        .eq('affiliate_id', affiliate?.id ?? '')
        .order('created_at', { ascending: false });

    // All commissions to compute unpaid balance
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, commission_amount, created_at')
        .eq('affiliate_id', affiliate?.id ?? '');

    const payoutMap = (payouts || []).map(p => new Date(p.created_at));

    const totalCommission = (commissions || []).reduce((s, c) => s + Number(c.amount || c.commission_amount || 0), 0);
    const totalPaid = (payouts || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    
    const unpaid = (commissions || []).reduce((sum, c) => {
        const commDate = new Date(c.created_at);
        const settled = payoutMap.some(pd => pd >= commDate);
        return sum + (settled ? 0 : Number(c.amount || c.commission_amount || 0));
    }, 0);
    const hasPendingRequest = (requests || []).some(r => r.status === 'pending');
    const payoutCount = (payouts || []).length;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pagedPayouts = (payouts || []).slice(start, start + PAGE_SIZE);

    return (
        <div className="space-y-6 max-w-5xl font-sans">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Wallet className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Payouts</h2>
                    <p className="text-sm text-zinc-400 font-medium">Your received payouts and transfer history</p>
                </div>
            </div>

            {/* Balance + Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <CardContent className="pt-6 relative">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Available Balance</p>
                        <div className={`text-4xl font-bold font-mono tracking-tight ${unpaid > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            ${unpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-zinc-600 font-mono mt-2">
                            Total earned: ${totalCommission.toFixed(2)} — Total paid: ${totalPaid.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-zinc-700 font-mono mt-1">
                            * 3.5% Stripe processing fee is deducted from payout transfers
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardContent className="pt-6">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Received</p>
                        <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
                            {(payouts || []).length}
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">payouts processed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Request Payout + Threshold UI — client component */}
            <PortalPayoutActions
                affiliateId={affiliate?.id ?? ''}
                unpaid={unpaid}
                currentThreshold={affiliate?.payout_threshold ?? 0}
                hasPendingRequest={hasPendingRequest}
            />

            {/* Pending Requests */}
            {(requests || []).filter(r => r.status === 'pending').length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl border-amber-500/20">
                    <CardHeader className="pb-3 border-b border-zinc-800/50">
                        <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(requests || []).filter(r => r.status === 'pending').map(r => (
                            <div key={r.id} className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/30 last:border-0">
                                <div>
                                    <p className="text-sm font-semibold text-amber-300">
                                        ${Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} requested
                                    </p>
                                    <p className="text-zinc-600 text-[10px] font-mono mt-0.5">
                                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className="text-[10px] uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                                    {r.status}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Payouts Table */}
            <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Payout History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {(!payouts || payouts.length === 0) ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                                <Wallet className="w-5 h-5 text-zinc-700" />
                            </div>
                            <h3 className="text-zinc-400 font-semibold mb-1">No Payouts Yet</h3>
                            <p className="text-zinc-600 text-sm max-w-xs">When your commissions are processed and transferred, the records will appear here.</p>
                        </div>
                    ) : (
                        <>
                        <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50 bg-zinc-950/50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-left">Notes</th>
                                    <th className="px-6 py-3 text-center">Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {pagedPayouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-3 text-zinc-400 font-mono text-xs">
                                            {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-emerald-400">
                                            ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            <span className="text-zinc-600 text-[10px] ml-1 font-normal">{(p.currency || 'USD').toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-zinc-400 text-xs">{p.notes || '—'}</td>
                                        <td className="px-6 py-3 text-center text-zinc-500 text-xs font-mono">{p.period || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Suspense fallback={null}>
                            <Pagination totalCount={payoutCount} pageSize={PAGE_SIZE} currentPage={currentPage} />
                        </Suspense>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
