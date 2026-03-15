export default function AffiliatePayoutsPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Payouts</h2>
                <p className="text-zinc-500 text-sm font-medium">View your received payouts and transfer history.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-amber-500/50 transition-colors duration-500"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                </div>
                <h3 className="text-zinc-300 font-semibold mb-1">No Payouts Yet</h3>
                <p className="text-zinc-500 text-sm max-w-sm">When your commissions are processed and transferred, the ledger records will appear here.</p>
            </div>
        </div>
    );
}
