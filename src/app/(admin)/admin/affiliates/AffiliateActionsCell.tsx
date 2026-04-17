'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit2, Ban, CheckCircle2, UserCheck, UserX, AlertTriangle, Info, Tag, RefreshCw, Loader2, Ticket, Check, ChevronsUpDown } from "lucide-react";
import { updateAffiliate, banAffiliate, activateAffiliate, approvePendingAffiliate, denyPendingAffiliate } from "@/app/actions/admin";
import { addAffiliateDirectly } from "./actions";
import { AffiliateEditDialog } from "./AffiliateEditDialog";
import { PlusCircle } from "lucide-react";

let globalCouponsCache: { id: string; name: string; percent_off: number | null; amount_off: number | null }[] | null = null;
let globalCouponsFetching = false;

export function AffiliateActionsCell({ affiliate, campaigns }: { affiliate: any, campaigns: any[] }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBanOpen, setIsBanOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isPendingOpen, setIsPendingOpen] = useState(false);
    const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
    
    // Add Campaign State
    const [newCampaignId, setNewCampaignId] = useState('');
    const [newCampaignRefCode, setNewCampaignRefCode] = useState('');
    const [addCampaignError, setAddCampaignError] = useState<string | null>(null);

    const [pendingAction, setPendingAction] = useState<'approve' | 'deny' | 'ban'>('approve');
    const [isLoading, setIsLoading] = useState(false);

    const isBanned = affiliate.status === 'banned';
    const isPending = affiliate.status === 'pending';

    // Dropdown mousedown listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Simplified ref logic since it's only dropdown now
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleAddCampaign() {
        if (!newCampaignId || !newCampaignRefCode) return;
        setIsLoading(true);
        setAddCampaignError(null);
        try {
            const formData = new FormData();
            formData.append('name', affiliate.name || 'Unknown');
            formData.append('email', affiliate.email);
            formData.append('referralCode', newCampaignRefCode);
            formData.append('campaign_id', newCampaignId);
            
            const result = await addAffiliateDirectly(formData);
            if (result?.error) {
                setAddCampaignError(result.error);
            } else {
                setIsAddCampaignOpen(false);
            }
        } catch (error: any) {
            setAddCampaignError(error.message || 'Failed to assign campaign.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleEditAction(formData: FormData) {
        setIsLoading(true);
        try {
            await updateAffiliate(affiliate.id, formData);
            setIsEditOpen(false);
        } catch (error) {
            console.error('Editing failed', error);
        } finally {
            setIsLoading(false);
        }
    }



    async function handleBanToggle() {
        setIsLoading(true);
        try {
            if (isBanned) {
                await activateAffiliate(affiliate.id);
            } else {
                await banAffiliate(affiliate.id);
            }
            setIsBanOpen(false);
        } catch (error) {
            console.error("Ban toggle failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePendingReview() {
        setIsLoading(true);
        try {
            if (pendingAction === 'approve') {
                await approvePendingAffiliate(affiliate.id);
            } else if (pendingAction === 'deny') {
                await denyPendingAffiliate(affiliate.id, false);
            } else {
                await denyPendingAffiliate(affiliate.id, true);
            }
            setIsPendingOpen(false);
        } catch (error) {
            console.error("Pending review failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-orange-400 transition-colors mx-auto active:scale-95">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200 z-50">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    {isPending && (
                        <DropdownMenuItem
                            className="hover:bg-zinc-900 cursor-pointer text-amber-400 hover:text-amber-300"
                            onClick={() => setIsPendingOpen(true)}
                        >
                            <UserCheck className="w-4 h-4 mr-2" /> Review Application
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsViewOpen(true)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    {!isPending && (
                        <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsEditOpen(true)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Affiliate
                        </DropdownMenuItem>
                    )}
                    {!isPending && (
                        <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-orange-400 hover:text-orange-300" onClick={() => setIsAddCampaignOpen(true)}>
                            <PlusCircle className="w-4 h-4 mr-2" /> Add to Campaign
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    {!isPending && (
                        <DropdownMenuItem
                            className={`hover:bg-zinc-900 cursor-pointer ${isBanned ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'}`}
                            onClick={() => setIsBanOpen(true)}
                        >
                            {isBanned ? (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Unban Affiliate</>
                            ) : (
                                <><Ban className="w-4 h-4 mr-2" /> Ban Affiliate</>
                            )}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Add to Campaign Dialog */}
            <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-orange-500">
                            <PlusCircle className="w-5 h-5" />
                            Add to another Campaign
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Assign <strong>{affiliate.name}</strong> ({affiliate.email}) to a new campaign. This will generate a separate tracking portal for them.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {addCampaignError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
                            {addCampaignError}
                        </div>
                    )}
                    
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="new-campaign" className="text-zinc-300 text-xs">Select Campaign</Label>
                            <select 
                                id="new-campaign" 
                                value={newCampaignId} 
                                onChange={e => setNewCampaignId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Choose a campaign...</option>
                                {campaigns.filter(c => c.id !== affiliate.campaign_id).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-refcode" className="text-zinc-300 text-xs">New Referral Code</Label>
                            <Input 
                                id="new-refcode" 
                                value={newCampaignRefCode} 
                                onChange={e => setNewCampaignRefCode(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                placeholder="e.g. john20" 
                                className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500 font-mono" 
                            />
                            <p className="text-[10px] text-zinc-500">Must be totally unique (e.g. {affiliate.name.split(' ')[0].toLowerCase()}_camp2)</p>
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsAddCampaignOpen(false)} disabled={isLoading} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleAddCampaign} disabled={isLoading || !newCampaignId || !newCampaignRefCode} className="bg-orange-600 hover:bg-orange-500 text-white font-semibold">
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add to Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pending Approval Review Dialog */}
            <Dialog open={isPendingOpen} onOpenChange={setIsPendingOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                            Affiliate Pending Approval
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3 text-zinc-400 text-sm mt-2">
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                        <p><span className="text-amber-300 font-semibold">{affiliate.name}</span> has applied to join your affiliate program.</p>
                                    </div>
                                    <div className="text-xs text-zinc-500 space-y-1.5 pl-6">
                                        <p><span className="text-zinc-400">1) Approve:</span> Lets them log into their portal and start tracking referrals.</p>
                                        <p><span className="text-zinc-400">2) Deny (allow re-apply):</span> Removes this application — they can re-apply with a new submission.</p>
                                        <p><span className="text-zinc-400">3) Deny &amp; ban email:</span> Permanently blocks their email from reapplying.</p>
                                    </div>
                                </div>

                                {/* Affiliate info grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Email</span><p className="font-mono text-zinc-300">{affiliate.email}</p></div>
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Name</span><p className="text-zinc-200 font-medium">{affiliate.name}</p></div>
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Ref Code</span><p className="font-mono text-orange-400">{(affiliate as any).referral_code || affiliate.ref_code || '—'}</p></div>
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Payout Email</span><p className="font-mono text-zinc-300">{affiliate.payout_email || <span className="text-zinc-600">Not set</span>}</p></div>
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Campaign</span><p className="text-zinc-300">{affiliate.campaign?.name || campaigns?.find(c => c.id === affiliate.campaign_id)?.name || '—'}</p></div>
                                    <div><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Applied</span><p className="text-zinc-300">{new Date(affiliate.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p></div>
                                    {(affiliate as any).details && (
                                        <div className="col-span-2"><span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Details</span><p className="text-zinc-300">{(affiliate as any).details}</p></div>
                                    )}
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 py-2">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider">Choose an action</Label>
                        <div className="space-y-2">
                            {([
                                { value: 'approve', label: 'Approve application', desc: 'Grant access to affiliate portal', color: 'border-emerald-500/50 text-emerald-400', icon: UserCheck },
                                { value: 'deny', label: 'Deny — allow re-apply', desc: 'Delete application, they can try again', color: 'border-zinc-700 text-zinc-300', icon: UserX },
                                { value: 'ban', label: 'Deny &amp; ban email', desc: 'Block this email permanently', color: 'border-red-500/50 text-red-400', icon: Ban },
                            ] as const).map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPendingAction(opt.value)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${pendingAction === opt.value ? opt.color + ' bg-zinc-900' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <opt.icon className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: opt.label }} />
                                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPendingOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button
                            onClick={handlePendingReview}
                            disabled={isLoading}
                            className={
                                pendingAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold' :
                                    pendingAction === 'ban' ? 'bg-red-600 hover:bg-red-500 text-white font-semibold' :
                                        'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold'
                            }
                        >
                            {isLoading ? 'Processing...' : pendingAction === 'approve' ? 'Approve' : pendingAction === 'ban' ? 'Deny & Ban' : 'Deny'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isEditOpen && (
                <AffiliateEditDialog 
                    affiliate={affiliate} 
                    open={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                    campaigns={campaigns} 
                />
            )}

            {/* View Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <Eye className="w-5 h-5 text-orange-500" />
                            Affiliate Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Full Name</span>
                                <p className="font-medium text-zinc-200">{affiliate.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Email</span>
                                <p className="font-mono text-zinc-300 break-all">{affiliate.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Status</span>
                                <div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${affiliate.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : affiliate.status === 'banned' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                        {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Ref Code</span>
                                <p className="font-mono text-orange-400">{(affiliate as any).referral_code || affiliate.ref_code || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Join Date</span>
                                <p className="font-mono text-zinc-300">{new Date(affiliate.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Payout Email</span>
                                <p className="font-mono text-zinc-300 break-all">{affiliate.payout_email || <span className="text-zinc-600">Not set</span>}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Campaign</span>
                                <p className="font-medium text-zinc-300">{affiliate.campaign?.name || campaigns?.find(c => c.id === affiliate.campaign_id)?.name || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Promo Code</span>
                                <p className="font-mono text-indigo-400">{affiliate.stripe_promo_code || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Total Clicks</span>
                                <p className="font-mono font-medium text-zinc-200 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded w-max">{affiliate.clicks || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Total Earned</span>
                                <p className="font-mono font-bold text-orange-400">${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            {(affiliate.details || affiliate.notes) && (
                                <div className="col-span-2 space-y-1">
                                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Notes / Details</span>
                                    {affiliate.details && <p className="text-zinc-300 whitespace-pre-wrap">{affiliate.details}</p>}
                                    {affiliate.notes && <p className="text-zinc-400 whitespace-pre-wrap mt-1 italic">{affiliate.notes}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ban/Unban Confirmation */}
            <Dialog open={isBanOpen} onOpenChange={setIsBanOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${isBanned ? 'text-green-500' : 'text-red-500'}`}>
                            {isBanned ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                            {isBanned ? 'Unban' : 'Ban'} Affiliate
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to {isBanned ? 'unban' : 'ban'} <strong className="text-zinc-200">{affiliate.name}</strong>?
                            {isBanned ? ' They will regain access to their portal and their links will start tracking again.' : ' They will lose access to their portal and their tracking links will be paused.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsBanOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleBanToggle} disabled={isLoading} className={isBanned ? "bg-green-600 hover:bg-green-500 text-white font-semibold" : "bg-red-600 hover:bg-red-500 text-white font-semibold"}>
                            {isLoading ? "Processing..." : isBanned ? "Yes, Unban" : "Yes, Ban"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
