import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Activity, ExternalLink, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";

export default async function ReferredUsersPage() {
    const supabase = await createClient();

    // In a full implementation, we would query the `referrals` table.
    // However, if the user hasn't run the SQL script yet, we might get an error.
    // For now, we will attempt to fetch, but gracefully fallback to an empty array.
    const { data: referrals, error } = await supabase
        .from('referrals')
        .select(`
            *,
            affiliate:affiliates(name, email)
        `)
        .order('created_at', { ascending: false });

    const totalReferrals = referrals?.length || 0;
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <Network className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Network Graph</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-indigo-500/50 pl-2 ml-1 mt-1">Attributed user signups</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> Total Attributed Ecosystem
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                            {totalReferrals}
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
                            {activeReferrals} <span className="text-sm font-sans tracking-widest text-zinc-500 uppercase">Users</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />

                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search users or tracking nodes..."
                        className="pl-10 h-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-lg text-sm font-mono"
                    />
                </div>

                <Button variant="outline" className="w-full md:w-auto bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-indigo-400">
                    <ExternalLink className="w-4 h-4 mr-2" /> Export Network Graph
                </Button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">ID / Acquisition Date</th>
                                <th className="px-6 py-4 whitespace-nowrap">Attributed Parent Node</th>
                                <th className="px-6 py-4 whitespace-nowrap">User Identity</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {(!referrals || referrals.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {error ? "Storage error: run setup_supabase_tables.sql in Supabase SQL editor." : "No attributed users in the network yet."}
                                    </td>
                                </tr>
                            )}
                            {referrals?.map((ref) => (
                                <tr key={ref.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group relative">
                                    <td className="w-0 p-0 absolute left-0 top-0 h-full">
                                        <div className="w-0.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-zinc-500 truncate w-24" title={ref.id}>{ref.id}</div>
                                        <div className="text-zinc-300 text-xs mt-1">
                                            {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                                            {ref.affiliate?.name || 'Unknown Affiliate'}
                                        </div>
                                        <div className="text-zinc-500 text-xs font-mono ml-3.5 mt-0.5">{ref.affiliate_id}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-300">
                                        {ref.referred_email || 'Hidden'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                            ${ref.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                            {ref.status}
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
