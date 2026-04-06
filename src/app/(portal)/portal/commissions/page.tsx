import { createClient } from "@/utils/supabase/server";
import { DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 30;

export default async function AffiliateCommissionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, org_id, total_commission, campaign:campaigns(show_customer_email)')
        .eq('user_id', user.id)
        .single();

    if (!affiliate) return null;

    const showEmail = (affiliate.campaign as any)?.show_customer_email === true;

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10));

    const { data: commissions, error } = await supabase
        .from('commissions')
        .select('id, amount, commission_amount, customer_email, status, created_at, referral_id')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

    const allCommissions = commissions || [];

    const totalEarned   = allCommissions.reduce((s, c) => s + Number(c.commission_amount || c.amount || 0), 0);
    const pendingAmount = allCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount || c.amount || 0), 0);
    const paidAmount    = allCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount || c.amount || 0), 0);

    const total = allCommissions.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = allCommissions.slice(start, start + PAGE_SIZE);

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Commissions</h2>
                <p className="text-zinc-500 text-sm font-medium">Track your earned commissions.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-orange-500" /> Total Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-400 font-mono tracking-tight">
                            ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" /> Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-400 font-mono tracking-tight">
                            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Paid Out
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
                            ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Commission</th>
                                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {error ? "Error fetching commissions." : "No commissions yet."}
                                    </td>
                                </tr>
                            )}
                            {paged.map((c) => {
                                const commAmount = Number(c.commission_amount || c.amount || 0);
                                const email = c.customer_email || '—';
                                const redacted = showEmail
                                    ? email
                                    : email.replace(/(.{2})(.*)(?=@)/, (_: string, keep: string, mid: string) => keep + mid.replace(/./g, '*'));
                                return (
                                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors duration-200 border-l-2 border-transparent hover:border-orange-500">
                                        <td className="px-6 py-4 font-mono text-zinc-300 text-sm">{redacted}</td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-orange-400 font-mono font-semibold">
                                                ${commAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                                ${c.status === 'paid'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : c.status === 'void'
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                {c.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination totalCount={total} pageSize={PAGE_SIZE} currentPage={currentPage} />
            </div>
        </div>
    );
}
