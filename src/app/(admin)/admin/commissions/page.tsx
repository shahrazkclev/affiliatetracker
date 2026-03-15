import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, DollarSign, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { CommissionsActionsCell } from "./CommissionsActionsCell";

export default async function CommissionsPage() {
    const supabase = await createClient();

    // Fetch commissions with affiliate names
    const { data: commissions } = await supabase
        .from('commissions')
        .select(`
            *,
            affiliate:affiliates(name, email)
        `)
        .order('created_at', { ascending: false });

    const totalVolume = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    const pendingCount = commissions?.filter(c => c.status === 'pending').length || 0;
    const completedCount = commissions?.filter(c => c.status === 'paid' || c.status === 'completed').length || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Commissions Ledger</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-emerald-500/50 pl-2 ml-1 mt-1">Row-level transaction records</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            Global Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
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

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
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

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />

                <Tabs defaultValue="all" className="w-full md:w-auto">
                    <TabsList className="bg-zinc-950 border border-zinc-800 p-1 flex shadow-inner rounded-lg">
                        <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-xs uppercase tracking-wider">All</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-zinc-500 text-xs uppercase tracking-wider">Pending</TabsTrigger>
                        <TabsTrigger value="paid" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 text-zinc-500 text-xs uppercase tracking-wider">Paid</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by affiliate name..."
                        className="pl-10 h-9 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded-lg text-sm"
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">ID / Date</th>
                                <th className="px-6 py-4 whitespace-nowrap">Affiliate Node</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                                <th className="px-6 py-4 whitespace-nowrap w-16 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {(!commissions || commissions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        No commissions synced yet. Run the synchronization tool in settings.
                                    </td>
                                </tr>
                            )}
                            {commissions?.map((comm) => (
                                <tr key={comm.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group relative">
                                    <td className="w-0 p-0 absolute left-0 top-0 h-full">
                                        <div className="w-0.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-zinc-500 truncate w-24" title={comm.id}>{comm.id}</div>
                                        <div className="text-zinc-300 text-xs mt-1">
                                            {new Date(comm.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200">{comm.affiliate?.name || 'Unknown Affiliate'}</div>
                                        <div className="text-zinc-500 text-xs font-mono truncate w-40">{comm.affiliate?.email || comm.affiliate_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                            ${comm.status === 'paid' || comm.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                comm.status === 'void' || comm.status === 'denied' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                            {comm.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                        <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]">
                                            ${Number(comm.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center cursor-pointer">
                                        <CommissionsActionsCell commission={comm} />
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
