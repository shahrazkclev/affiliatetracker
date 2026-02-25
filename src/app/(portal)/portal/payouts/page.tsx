export default function AffiliatePayoutsPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Payouts</h2>
                <p className="text-slate-500 text-sm">View your received payouts.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 shadow-sm">
                No Payouts Yet
            </div>
        </div>
    );
}
