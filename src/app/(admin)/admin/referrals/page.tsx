import { GitMerge } from "lucide-react";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import { StatusFilter } from "./StatusFilter";
import { AddManualReferralModal } from "./AddManualReferralModal";
import { ReferralsTabs } from "./ReferralsTabs";
import { SalesView } from "./SalesView";
import { CustomersView } from "./CustomersView";

const PAGE_SIZE = 25;

export default async function ReferralsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; status?: string; tab?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: teamMembership } = await supabase.from('team_members').select('org_id').eq('user_id', user?.id || '').single();
    const orgId = teamMembership?.org_id;

    if (!orgId) return <div className="p-8 text-red-500">Organization not found.</div>;

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || "1", 10));
    const searchQuery = (params.q || "").trim();
    const statusFilter = params.status || "all";
    const currentTab = params.tab || "sales";

    // ONLY FETCH SALES DATA IF WE ARE ON THE SALES TAB
    let processedReferrals: any[] = [];
    let tabCounts = { all: 0, paid: 0, pending: 0 };
    let campaigns: any[] = [];
    let allAffiliates: any[] = [];

    if (currentTab === 'sales') {
        const [
            { data: affiliatesData },
            { data: allCommissions },
            { data: allPayouts },
            { data: camps }
        ] = await Promise.all([
            supabase.from("affiliates").select("*").eq("org_id", orgId).limit(5000),
            supabase.from("commissions").select("id, amount, revenue, status, affiliate_id, created_at, referral_id, referral:referrals(customer_email)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(10000),
            supabase.from("payouts").select("affiliate_id, created_at").eq("org_id", orgId).limit(10000),
            supabase.from('campaigns').select('*').eq('org_id', orgId)
        ]);

        campaigns = camps || [];
        allAffiliates = affiliatesData || [];

        const affMap: Record<string, any> = {};
        for (const a of affiliatesData || []) affMap[a.id] = a;

        const payoutMap: Record<string, Date[]> = {};
        for (const p of allPayouts || []) {
            if (!payoutMap[p.affiliate_id]) payoutMap[p.affiliate_id] = [];
            payoutMap[p.affiliate_id].push(new Date(p.created_at));
        }

        processedReferrals = (allCommissions || []).map((c: any) => {
            const dates = payoutMap[c.affiliate_id] || [];
            const commDate = new Date(c.created_at);
            const settled = dates.some(pd => pd >= commDate);
            const effectiveStatus = settled ? 'paid' : (c.status || 'pending');

            let customerEmail = "Unknown";
            if (c.referral && !Array.isArray(c.referral)) {
                customerEmail = c.referral.customer_email || "Unknown";
            }

            return {
                id: c.id,
                customer_email: customerEmail,
                status: effectiveStatus,
                affiliate: c.affiliate_id ? affMap[c.affiliate_id] ?? null : null,
                totalCommission: Number(c.amount || 0),
                totalRevenue: Number(c.revenue || 0),
                created_at: c.created_at
            };
        });

        tabCounts = {
            all: processedReferrals.length,
            paid: processedReferrals.filter(r => r.status === 'paid').length,
            pending: processedReferrals.filter(r => r.status === 'pending').length,
        };

        if (statusFilter !== "all") {
            processedReferrals = processedReferrals.filter(r => r.status === statusFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            processedReferrals = processedReferrals.filter(r => {
                return (
                    r.customer_email?.toLowerCase().includes(q) ||
                    r.affiliate?.name?.toLowerCase().includes(q) ||
                    r.affiliate?.email?.toLowerCase().includes(q)
                );
            });
        }
    }

    return (
        <div className="space-y-6 w-full max-w-full font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <GitMerge className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Sales from affiliates</h2>
                        <p className="text-base text-zinc-400 font-medium tracking-wide mt-1">
                            See exactly <span className="text-indigo-400 font-semibold">who brought this customer</span> and how much they earned
                        </p>
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                <ReferralsTabs />
            </Suspense>

            {/* Search + Actions Chrome */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="w-full sm:w-[360px]">
                        <AdminSearchBar
                            placeholder="Search by email, affiliate, or Stripe ID…"
                            accentColor="amber"
                        />
                    </div>
                    {currentTab === 'sales' && (
                        <Suspense fallback={null}>
                            <StatusFilter activeStatus={statusFilter} counts={tabCounts} />
                        </Suspense>
                    )}
                </div>
                {currentTab === 'sales' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                        <AddManualReferralModal affiliates={allAffiliates || []} />
                        <ExportCsvButton
                            href={`/api/admin/export/referrals?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), ...(statusFilter !== 'all' ? { status: statusFilter } : {}) }).toString()}`}
                            accentColor="amber"
                        />
                    </div>
                )}
            </div>

            {currentTab === 'sales' ? (
                <SalesView 
                    processedReferrals={processedReferrals}
                    tabCounts={tabCounts}
                    currentPage={currentPage}
                    PAGE_SIZE={PAGE_SIZE}
                    campaigns={campaigns}
                    allAffiliates={allAffiliates}
                />
            ) : (
                <CustomersView orgId={orgId} searchQuery={searchQuery} currentPage={currentPage} PAGE_SIZE={PAGE_SIZE} />
            )}
        </div>
    );
}
