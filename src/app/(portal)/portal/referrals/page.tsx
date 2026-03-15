export default function AffiliateReferralsPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Captured Traffic</h2>
                <p className="text-zinc-500 text-sm font-medium">View users who successfully signed up using your routing link.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-orange-500/50 transition-colors duration-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 className="text-zinc-300 font-semibold mb-1">No Captures Yet</h3>
                <p className="text-zinc-500 text-sm max-w-sm">Share your affiliate link to start routing traffic and capturing referrals in this module.</p>
            </div>
        </div>
    );
}
