'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react";
import { markPayoutAsPaid, delayPayout } from "@/app/actions/admin";

export function PayoutActionsCell({ affiliate }: { affiliate: any }) {
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
    const [isDelayOpen, setIsDelayOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleMarkPaid(formData: FormData) {
        setIsLoading(true);
        const notes = formData.get('notes') as string;
        try {
            await markPayoutAsPaid(affiliate.id, Number(affiliate.total_commission), notes);
            setIsMarkPaidOpen(false);
        } catch (error) {
            console.error("Mark paid failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelayPayout() {
        setIsLoading(true);
        try {
            await delayPayout(affiliate.id);
            setIsDelayOpen(false);
        } catch (error) {
            console.error("Delay payout failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors mx-auto active:scale-95">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsViewOpen(true)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsMarkPaidOpen(true)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-red-500 hover:text-red-400" onClick={() => setIsDelayOpen(true)}>
                        <Clock className="w-4 h-4 mr-2" /> Delay Payout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* View Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <Eye className="w-5 h-5 text-amber-500" />
                            Payout Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Affiliate Node</span>
                                <p className="font-medium text-zinc-200">{affiliate.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Routing Email</span>
                                <p className="font-mono text-zinc-300 break-all">{affiliate.payout_email || affiliate.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Outstanding Balance</span>
                                <p className="font-mono font-bold text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Active Status</span>
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                        Cleared for Payout
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mark as Paid Dialog */}
            <Dialog open={isMarkPaidOpen} onOpenChange={setIsMarkPaidOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            Confirm Payout
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            You are about to mark a payload of <strong className="text-amber-400 font-mono">${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> to <strong className="text-zinc-200">{affiliate.name}</strong> as paid.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleMarkPaid} className="grid gap-4 py-4">
                        <div className="grid gap-2 text-sm text-zinc-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mb-2">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <p>This will reset their current outstanding commission balance to $0.00 and log a completed payout event.</p>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes" className="text-zinc-300">Transaction Notes (Optional)</Label>
                            <Input id="notes" name="notes" placeholder="e.g. PayPal TXN-9283401" className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-amber-500" />
                            <p className="text-xs text-zinc-500">Add a transaction ID or reference for your records.</p>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsMarkPaidOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-500 text-black font-semibold">
                                {isLoading ? "Processing..." : "Confirm Payment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delay Payout Dialog */}
            <Dialog open={isDelayOpen} onOpenChange={setIsDelayOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
                            <Clock className="w-5 h-5" />
                            Delay Payout
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to postpone this payout for <strong className="text-zinc-200">{affiliate.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-sm text-zinc-400">
                        This action does not currently notify the affiliate, but tags the payout internally as delayed.
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDelayOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleDelayPayout} disabled={isLoading} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                            {isLoading ? "Processing..." : "Yes, Delay Payout"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
