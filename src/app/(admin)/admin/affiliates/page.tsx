import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Network, Scan, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { CopyButton } from "@/components/CopyButton";
import { AffiliatesTable } from "./AffiliatesTable";
import { AddAffiliateDialog } from "./AddAffiliateDialog";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { Suspense } from "react";

const PAGE_SIZE = 20;

export default async function AffiliatesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;
    const activeStatus = params.status || "active";
    const currentPage = Math.max(1, parseInt(params.page || "1", 10));
    const searchQuery = (params.q || "").trim();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: org } = await supabase.from('organizations').select('id, custom_domain').eq('owner_id', user?.id || '').single();
    const orgId = org?.id;
    const portalUrl = org?.custom_domain ? `https://${org.custom_domain}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://affiliatemango.com");

    // ── DB-level query ────────────────────────────────────────────────────────
    let query = supabase
        .from("affiliates")
        .select(`*, campaign:campaigns(name)`, { count: "exact" })
        .eq("org_id", orgId)
        .eq("status", activeStatus)
        .order("created_at", { ascending: false });

    if (searchQuery) {
        query = query.or(
            `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,referral_code.ilike.%${searchQuery}%,ref_code.ilike.%${searchQuery}%`
        );
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const { data: affiliates, count: filteredCount } = await query.range(start, start + PAGE_SIZE - 1);

    // Counts per status for tab badges — 3 parallel count queries, accurate regardless of nulls
    const [{ count: activeCount }, { count: pendingCount }, { count: bannedCount }] = await Promise.all([
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "active"),
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "pending"),
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "banned"),
    ]);
    const counts = {
        active: activeCount ?? 0,
        pending: pendingCount ?? 0,
        banned: bannedCount ?? 0,
    };


    // Campaigns for add/edit dialogs
    const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name");

    // Calculate total revenue for the headline
    const { data: stats } = await supabase.from('affiliates').select('total_commission').eq('org_id', orgId);
    const totalCommissions = stats?.reduce((acc, curr) => acc + Number(curr.total_commission || 0), 0) || 0;
    const estimatedRevenue = totalCommissions * 3.33; // Default 30% margin estimation

    return (
        <div className="space-y-6 w-full font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Your sales team</h2>
                        <p className="text-base text-zinc-400 font-medium mt-1">
                            Your affiliates have generated <span className="text-emerald-400 font-bold">${estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> in total
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-500 hover:bg-orange-400 text-black font-bold border-none transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 px-6">
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Copy invite link
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                                    <LinkIcon className="w-5 h-5 text-orange-500" />
                                    Invite a new affiliate
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Send this link to anyone you want selling for you.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 pt-4">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">Link</Label>
                                    <Input
                                        id="link"
                                        defaultValue={portalUrl}
                                        readOnly
                                        className="bg-zinc-900 border-zinc-700 text-zinc-300 focus-visible:ring-orange-500"
                                    />
                                </div>
                                <CopyButton text={portalUrl} className="bg-orange-500 hover:bg-orange-400 text-black font-bold border-none" />
                            </div>
                            <DialogFooter className="sm:justify-start">
                                <p className="text-xs text-zinc-500 font-mono mt-4">
                                    They will automatically join your default tracking campaign.
                                </p>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AddAffiliateDialog campaigns={campaigns || []} portalUrl={portalUrl} />
                </div>
            </div>

            <AffiliatesTable
                affiliates={affiliates || []}
                campaigns={campaigns || []}
                activeStatus={activeStatus}
                counts={counts}
                totalCount={filteredCount ?? 0}
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                searchBar={
                    <Suspense fallback={null}>
                        <AdminSearchBar
                            initialQuery={searchQuery}
                            placeholder="Search by name, email, or ref code..."
                            accentColor="orange"
                        />
                    </Suspense>
                }
            />
        </div>
    );
}
