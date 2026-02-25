export default function AffiliateReferralsPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Referrals</h2>
                <p className="text-slate-500 text-sm">View users who signed up using your link.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 shadow-sm">
                No Referred Users Yet
            </div>
        </div>
    );
}
