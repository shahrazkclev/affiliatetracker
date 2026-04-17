import { Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/CopyButton";
import { AffiliateQuickViewButton } from "./AffiliateQuickViewButton";
import { AffiliateActionsCell } from "@/app/(admin)/admin/affiliates/AffiliateActionsCell";
import { Pagination } from "@/components/Pagination";

export function SalesView({ processedReferrals, tabCounts, currentPage, PAGE_SIZE, campaigns, allAffiliates }: any) {
    const start = (currentPage - 1) * PAGE_SIZE;
    const referralsSegment = processedReferrals.slice(start, start + PAGE_SIZE);

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative mt-6">
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
                            {referralsSegment.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <p className="text-zinc-500 font-medium">No referrals found.</p>
                                    </td>
                                </tr>
                            ) : (
                                referralsSegment.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-200">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-amber-100">{r.customer_email || '—'}</span>
                                                <CopyButton text={r.customer_email} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {r.affiliate ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-300 font-medium">{r.affiliate.name}</span>
                                                    <AffiliateQuickViewButton affiliate={r.affiliate} campaigns={campaigns} />
                                                </div>
                                            ) : (
                                                <span className="text-zinc-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-300 font-mono text-[13px]">
                                            ${r.totalRevenue.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-amber-400 font-mono font-medium text-[13px]">
                                            ${r.totalCommission.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs">
                                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                {r.status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {r.affiliate ? (
                                                <AffiliateActionsCell 
                                                    affiliate={r.affiliate} 
                                                    campaigns={campaigns} 
                                                />
                                            ) : (
                                                <span className="text-zinc-600 text-xs text-center w-full block">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {processedReferrals.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                        <Pagination
                            totalCount={processedReferrals.length}
                            pageSize={PAGE_SIZE}
                            currentPage={currentPage}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

