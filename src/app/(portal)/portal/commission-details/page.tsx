import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FileText, DollarSign, TrendingUp, Clock } from "lucide-react";

export default async function CommissionDetailsPage() {
    const supabase = await createClient();

    // Get the currently logged-in affiliate
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, name, total_commission, total_revenue')
        .eq('user_id', user!.id)
        .single();

    const { data: commissions } = affiliate
        ? await supabase
            .from('commissions')
            .select('id, revenue, commission_amount, amount, status, created_at, stripe_charge_id')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
        : { data: [] };

    const totalEarned = (commissions || []).reduce((s, c) => s + Number(c.commission_amount || c.amount || 0), 0);
    const totalRevenue = (commissions || []).reduce((s, c) => s + Number(c.revenue || 0), 0);
    const pendingCount = (commissions || []).filter(c => c.status === 'pending').length;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100">Commission Details</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">Full breakdown of every commission transaction</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Total Earned
                    </div>
                    <div className="text-3xl font-bold font-mono text-emerald-400">
                        ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Revenue Generated
                    </div>
                    <div className="text-3xl font-bold font-mono text-zinc-100">
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending
                    </div>
                    <div className="text-3xl font-bold font-mono text-amber-400">
                        {pendingCount} <span className="text-sm text-zinc-500 font-sans uppercase tracking-widest">transactions</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">Commission</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {(!commissions || commissions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                                        No commission transactions yet
                                    </td>
                                </tr>
                            )}
                            {(commissions || []).map(c => (
                                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors duration-200 border-l-2 border-transparent hover:border-orange-500">
                                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono">
                                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[11px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
                                            {c.stripe_charge_id ? c.stripe_charge_id.substring(0, 20) + '…' : c.id.substring(0, 8) + '…'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-zinc-300">
                                        ${Number(c.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                        ${Number(c.commission_amount || c.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                            c.status === 'paid' || c.status === 'completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {c.status || 'pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
