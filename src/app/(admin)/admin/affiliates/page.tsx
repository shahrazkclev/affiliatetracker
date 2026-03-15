import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical, Search, Scan, Link as LinkIcon, PlusCircle, Network, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/server";
import { CopyButton } from "@/components/CopyButton";
import { revalidatePath } from "next/cache";
import { AffiliateActionsCell } from "./AffiliateActionsCell";

export default async function AffiliatesPage() {
    const supabase = await createClient();

    // Fetch affiliates with their campaign
    const { data: affiliates } = await supabase
        .from('affiliates')
        .select(`
      *,
      campaign:campaigns(name)
    `)
        .order('created_at', { ascending: false });

    // Fetch unique campaigns for the filter dropdown
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name');

    const activeCount = affiliates?.filter(a => a.status === 'active').length || 0;
    const pendingCount = affiliates?.filter(a => a.status === 'pending').length || 0;
    const bannedCount = affiliates?.filter(a => a.status === 'banned').length || 0;

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
                                    <Label htmlFor="link" className="sr-only">
                                        Link
                                    </Label>
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

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-600 hover:bg-orange-500 text-black font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Affiliate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                                    <PlusCircle className="w-5 h-5 text-orange-500" />
                                    Add New Affiliate
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Manually add an affiliate to your network. They will receive an email to set their password.
                                </DialogDescription>
                            </DialogHeader>
                            <form action="/api/admin/invite-affiliate" method="POST" className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                                    <Input id="name" name="name" placeholder="John Doe" className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                                    <Input id="email" name="email" type="email" placeholder="user@example.com" className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="campaign" className="text-zinc-300">Assign Campaign</Label>
                                    <select id="campaign" name="campaign_id" className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer appearance-none">
                                        {campaigns?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <DialogFooter className="mt-4">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" className="bg-orange-600 hover:bg-orange-500 text-black font-semibold">Send Invite</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
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

            <div className="space-y-4">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="bg-zinc-900/80 border border-zinc-800/80 p-1 flex shadow-inner rounded-lg backdrop-blur-sm">
                        <TabsTrigger value="active" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-400 data-[state=active]:shadow-md text-zinc-400 rounded-md transition-all duration-300 flex-1 font-medium">Active ({activeCount})</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-yellow-400 data-[state=active]:shadow-md text-zinc-400 rounded-md transition-all duration-300 flex-1 font-medium">Pending ({pendingCount})</TabsTrigger>
                        <TabsTrigger value="banned" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-red-400 data-[state=active]:shadow-md text-zinc-400 rounded-md transition-all duration-300 flex-1 font-medium">Banned ({bannedCount})</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex flex-col md:flex-row gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                    <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent group-hover:via-orange-500/50 transition-colors duration-500" />

                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Query matrix by email, name, or code..."
                            className="pl-10 h-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-orange-500/50 rounded-lg font-mono text-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-px h-6 bg-zinc-800 hidden md:block"></div>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Filter:</span>
                        <select className="h-10 bg-zinc-950 border border-zinc-800 text-sm px-3 py-1.5 rounded-lg text-zinc-300 w-48 focus:outline-none focus:ring-1 focus:ring-orange-500/50 hover:bg-zinc-800/50 transition-colors cursor-pointer appearance-none">
                            <option value="all">Global Matrix (All)</option>
                            {campaigns?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-300">
                            <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Affiliate</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Join Date</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-right">Commission</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-center">Clicks</th>
                                    <th className="px-6 py-4 whitespace-nowrap w-16 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {affiliates?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                            No affiliates found
                                        </td>
                                    </tr>
                                )}
                                {affiliates?.map((affiliate) => (
                                    <tr key={affiliate.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group relative">
                                        {/* Hover indicator line */}
                                        <td className="w-0 p-0 absolute left-0 top-0 h-full">
                                            <div className="w-0.5 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-200 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500/50 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                {affiliate.name}
                                            </div>
                                            <div className="text-zinc-500 text-xs mt-0.5 ml-4 font-mono">{affiliate.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs font-mono">
                                            {new Date(affiliate.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                            {Number(affiliate.total_commission) > 0 ? (
                                                <span className="text-orange-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]">
                                                    ${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">$0.00</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${affiliate.clicks > 0 ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-600'}`}>
                                                {affiliate.clicks || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center cursor-pointer">
                                            <AffiliateActionsCell affiliate={affiliate} campaigns={campaigns || []} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
