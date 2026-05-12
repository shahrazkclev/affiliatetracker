import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, BellRing, Wallet } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PayoutDatePicker } from "@/components/PayoutDatePicker";
import { PayoutBatchSelector } from "./PayoutBatchSelector";
import { PayoutRequestsPanel } from "./PayoutRequestsPanel";
import { PayoutThresholdInput } from "@/components/PayoutThresholdInput";


export default async function GeneratePayoutsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string; minAmount?: string }>
}) {
    const supabase = await createClient();
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    const { data: teamMembership } = await admin.from('team_members').select('org_id').eq('user_id', user?.id || '').single();
    const org = teamMembership ? { id: teamMembership.org_id } : null;
    if (!org) return <div className="p-8 text-red-500">Organization not found.</div>;
    const orgId = org.id;

    const params = await searchParams;

    const isAllTime = params.date === 'all' || !params.date;
    const targetDate = params.date && params.date !== 'all' ? new Date(params.date) : new Date();
    const minAmount = Number(params.minAmount) || 0;

    // Fetch affiliates
    const { data: allAffiliates } = await admin.from('affiliates').select('*').eq('org_id', orgId);

    // Fetch ALL commissions (using admin client to bypass RLS and include all statuses)
    const { data: commissions, error: comErr } = await admin.from('commissions').select('affiliate_id, commission_amount, created_at').eq('org_id', orgId);
    if (comErr) console.error("GeneratePayouts Commissions err:", comErr);

    // Fetch payouts to calculate settled status dynamically
    const { data: payouts } = await admin.from('payouts').select('affiliate_id, created_at').eq('org_id', orgId);

    // Also fetch payout amounts to compute what's actually been paid
    const { data: payoutAmounts } = await admin.from('payouts').select('affiliate_id, amount').eq('org_id', orgId);

    // Calculate total commissions per affiliate
    const commissionSumMap: Record<string, number> = {};
    for (const c of commissions || []) {
        const commDate = new Date(c.created_at);
        if (!isAllTime && commDate > targetDate) continue;
        commissionSumMap[c.affiliate_id] = (commissionSumMap[c.affiliate_id] || 0) + Number(c.commission_amount);
    }

    // Calculate total payouts per affiliate
    const paidSumMap: Record<string, number> = {};
    for (const p of payoutAmounts || []) {
        paidSumMap[p.affiliate_id] = (paidSumMap[p.affiliate_id] || 0) + Number(p.amount);
    }

    // Amount owed = total commissions - total paid
    const pendingSumMap: Record<string, number> = {};
    let totalPaid = 0;
    for (const affId of Object.keys(commissionSumMap)) {
        const earned = commissionSumMap[affId] || 0;
        const paid = paidSumMap[affId] || 0;
        const owed = Math.max(0, earned - paid);
        if (owed > 0) pendingSumMap[affId] = owed;
        totalPaid += paid;
    }

    const totalReadyToPay = Object.values(pendingSumMap).reduce((a, b) => a + (b || 0), 0);

    // Compute final affiliates to render
    const affiliates = (allAffiliates || [])
        .map(a => ({
            ...a,
            amount_owed: pendingSumMap[a.id] || 0,
        }))
        .filter(a => a.amount_owed > 0 && a.amount_owed >= minAmount)
        .sort((a, b) => b.amount_owed - a.amount_owed);

    // Fetch pending payout requests from affiliates
    const { data: payoutRequests } = await admin
        .from('payout_requests')
        .select('id, amount, created_at, status, affiliate_id, affiliate:affiliates(name, email, payout_threshold, total_commission)')
        .eq('status', 'pending')
        .in('affiliate_id', (allAffiliates || []).map(a => a.id))
        .order('created_at', { ascending: false });



    return (
        <div className="space-y-6 w-full max-w-full font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Payout balances</h2>
                        <p className="text-base text-zinc-400 font-medium tracking-wide mt-1">
                            All commissions are calculated automatically
                        </p>
                    </div>
                </div>
                <div className="flex gap-6 sm:text-right mt-2 sm:mt-0">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Ready to pay</p>
                        <p className="text-2xl font-bold text-orange-400 tracking-tight">${totalReadyToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Already paid</p>
                        <p className="text-2xl font-bold text-zinc-300 tracking-tight">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Payout Requests — interactive panel with Paid/Dismiss actions */}
            <PayoutRequestsPanel requests={(payoutRequests || []) as any} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-200">Payout Date</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm">
                            Target date for this payout batch.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 rounded-lg w-max relative z-20">
                            <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Date</span>
                            <PayoutDatePicker initialDate={targetDate} isAllTime={isAllTime} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-200">Minimum Threshold</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm">
                            Affiliates must meet this amount to be included.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight flex items-end gap-2 pt-2">
                            <PayoutThresholdInput initialValue={minAmount} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <PayoutBatchSelector affiliates={affiliates} />
        </div>
    );
}
