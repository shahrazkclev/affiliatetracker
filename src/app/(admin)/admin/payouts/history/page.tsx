import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, History, Download, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";

export default async function PayoutHistoryPage() {
    const supabase = await createClient();

    // Fetch payout history
    const { data: payouts } = await supabase
        .from('payouts')
        .select(`
            *,
            affiliate:affiliates(name, email, payout_email)
        `)
        .order('created_at', { ascending: false });

    const totalPaid = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const payoutCount = payouts?.length || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            Total Historical Disbursements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <ReceiptText className="w-4 h-4 text-zinc-500" /> Execution Cycles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
                            {payoutCount} <span className="text-sm text-zinc-500 uppercase tracking-widest font-sans">Payouts Logged</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />

                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by ID, affiliate, or transaction memo..."
                        className="pl-10 h-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-600 rounded-lg text-sm font-mono"
                    />
                </div>

                <Button variant="outline" className="w-full md:w-auto bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Download className="w-4 h-4 mr-2" /> Export CSV Record
                </Button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Execution Date</th>
                                <th className="px-6 py-4 whitespace-nowrap">Affiliate Beneficiary</th>
                                <th className="px-6 py-4 whitespace-nowrap">Transaction Memo</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Disbursed Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {(!payouts || payouts.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        No historical payouts recorded yet.
                                    </td>
                                </tr>
                            )}
                            {payouts?.map((payout) => (
                                <tr key={payout.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group relative">
                                    <td className="w-0 p-0 absolute left-0 top-0 h-full">
                                        <div className="w-0.5 h-full bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-6 py-4 border-r border-zinc-800/30">
                                        <div className="text-zinc-300 font-medium">
                                            {new Date(payout.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="text-zinc-600 text-xs font-mono mt-0.5">
                                            {new Date(payout.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200">{payout.affiliate?.name || 'Unknown Affiliate'}</div>
                                        <div className="text-zinc-500 text-xs font-mono truncate w-48">{payout.affiliate?.payout_email || payout.affiliate?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded inline-block max-w-[200px] truncate" title={payout.notes || payout.id}>
                                            {payout.notes || `txn_${payout.id.substring(0, 8)}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                        <span className="text-zinc-300 font-mono text-base">
                                            ${Number(payout.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
