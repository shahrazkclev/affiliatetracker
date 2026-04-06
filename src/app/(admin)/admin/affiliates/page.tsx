import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Network, Scan } from "lucide-react";
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

    // ── DB-level query ────────────────────────────────────────────────────────
    let query = supabase
        .from("affiliates")
        .select(`*, campaign:campaigns(name)`, { count: "exact" })
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
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("status", "banned"),
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
        .order("name");

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <Network className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Affiliates</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-orange-500/50 pl-2 ml-1 mt-1">Manage network affiliates</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-orange-500/50 text-zinc-200 transition-all duration-300 shadow-lg active:scale-95 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <LinkIcon className="w-4 h-4 mr-2 text-orange-400" />
                                Invite Affiliate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                                    <LinkIcon className="w-5 h-5 text-orange-500" />
                                    Invite Affiliate
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Share this secure registration link with potential affiliates.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 pt-4">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">Link</Label>
                                    <Input
                                        id="link"
                                        defaultValue="https://affiliates.cleverpoly.store"
                                        readOnly
                                        className="bg-zinc-900 border-zinc-700 text-zinc-300 focus-visible:ring-orange-500"
                                    />
                                </div>
                                <CopyButton text="https://affiliates.cleverpoly.store" className="bg-orange-600 hover:bg-orange-500 text-black border-none" />
                            </div>
                            <DialogFooter className="sm:justify-start">
                                <p className="text-xs text-zinc-500 font-mono mt-4">
                                    Users signing up via this link will automatically be assigned to the default campaign.
                                </p>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AddAffiliateDialog campaigns={campaigns || []} />
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-orange-500/50 via-orange-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <Scan className="w-4 h-4 text-orange-400" /> Portal Gateway Access
                    </CardTitle>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">Routing link for external affiliate registration</p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center max-w-lg">
                        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center text-zinc-300 font-mono text-sm w-full shadow-inner ring-1 ring-orange-500/10 focus-within:ring-orange-500/30 transition-all">
                            <span className="text-zinc-500 mr-2">https://</span>affiliates.cleverpoly.store
                        </div>
                        <CopyButton
                            text="https://affiliates.cleverpoly.store"
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-md transition-all active:scale-95"
                        />
                    </div>
                </CardContent>
            </Card>

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
