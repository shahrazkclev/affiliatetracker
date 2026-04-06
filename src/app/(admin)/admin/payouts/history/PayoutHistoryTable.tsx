type Payout = {
    id: string;
    amount: number | string;
    currency?: string | null;
    notes?: string | null;
    created_at: string;
    period?: string | null;
    affiliate_id: string;
};

type AffiliateInfo = { name: string; email: string; payout_email: string };

interface PayoutHistoryTableProps {
    payouts: Payout[];
    affiliateMap: Record<string, AffiliateInfo>;
    searchQuery?: string;
}

export function PayoutHistoryTable({ payouts, affiliateMap, searchQuery }: PayoutHistoryTableProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent" />
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Date</th>
                            <th className="px-6 py-4 whitespace-nowrap">Affiliate</th>
                            <th className="px-6 py-4 whitespace-nowrap">Notes</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {payouts.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                    {searchQuery
                                        ? `No payouts matching "${searchQuery}".`
                                        : 'No historical payouts recorded yet.'}
                                </td>
                            </tr>
                        )}
                        {payouts.map((payout) => (
                            <tr
                                key={payout.id}
                                className="hover:bg-zinc-800/30 transition-colors duration-200 group border-l-2 border-transparent hover:border-zinc-600"
                            >
                                <td className="px-6 py-4 border-r border-zinc-800/30">
                                    <div className="text-zinc-300 font-medium">
                                        {new Date(payout.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: '2-digit', year: 'numeric',
                                        })}
                                    </div>
                                    <div className="text-zinc-600 text-xs font-mono mt-0.5">
                                        {new Date(payout.created_at).toLocaleTimeString('en-US', {
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-zinc-200">
                                        {affiliateMap[payout.affiliate_id]?.name || 'Unknown Affiliate'}
                                    </div>
                                    <div className="text-zinc-500 text-xs font-mono truncate w-48">
                                        {affiliateMap[payout.affiliate_id]?.payout_email ||
                                            affiliateMap[payout.affiliate_id]?.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div
                                        className="font-mono text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded inline-block max-w-[200px] truncate"
                                        title={payout.notes || payout.id}
                                    >
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
    );
}
