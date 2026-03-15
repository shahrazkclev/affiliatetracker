'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit2, Ban, CheckCircle2 } from "lucide-react";
import { updateAffiliate, banAffiliate, activateAffiliate } from "@/app/actions/admin";

export function AffiliateActionsCell({ affiliate, campaigns }: { affiliate: any, campaigns: any[] }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBanOpen, setIsBanOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isBanned = affiliate.status === 'banned';

    async function handleEditAction(formData: FormData) {
        setIsLoading(true);
        try {
            await updateAffiliate(affiliate.id, formData);
            setIsEditOpen(false);
        } catch (error) {
            console.error("Editing failed", error);
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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-orange-400 transition-colors mx-auto active:scale-95">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsViewOpen(true)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsEditOpen(true)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Affiliate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
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
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <Edit2 className="w-5 h-5 text-orange-500" />
                            Edit Affiliate
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Update details for {affiliate.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleEditAction} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-zinc-300">Name</Label>
                            <Input id="name" name="name" defaultValue={affiliate.name} required className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                            <Input id="email" name="email" type="email" defaultValue={affiliate.email} required className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="campaign" className="text-zinc-300">Assigned Campaign</Label>
                            <select id="campaign" name="campaign_id" defaultValue={affiliate.campaign_id} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer appearance-none">
                                {campaigns?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500 text-black font-semibold">
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Join Date</span>
                                <p className="font-mono text-zinc-300">{new Date(affiliate.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Total Clicks</span>
                                <p className="font-mono font-medium text-zinc-200 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded w-max">{affiliate.clicks || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Total Earned</span>
                                <p className="font-mono font-bold text-orange-400">${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
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
