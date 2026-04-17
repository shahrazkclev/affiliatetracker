'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle2, Circle, Trash2, AlertTriangle } from "lucide-react";
import { updateReferralStatus, deleteReferral } from "@/app/actions/admin";

export function ReferralActionsCell({ referral }: { referral: any }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const isPaid = referral.status === 'paid';

    const handleStatusToggle = async () => {
        setIsUpdating(true);
        const newStatus = isPaid ? 'pending' : 'paid';
        await updateReferralStatus(referral.id, newStatus);
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        setIsUpdating(true);
        await deleteReferral(referral.id);
        setIsUpdating(false);
        setIsDeleteOpen(false);
    };

    return (
        <div className="flex justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus:ring-0 focus-visible:ring-0 rounded-md">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] bg-zinc-950 border-zinc-800 text-zinc-300">
                    <DropdownMenuLabel className="text-xs text-zinc-500 font-mono uppercase tracking-widest text-center">Referral Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    
                    <DropdownMenuItem 
                        onClick={(e) => { e.preventDefault(); handleStatusToggle(); }}
                        disabled={isUpdating}
                        className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
                    >
                        {isPaid ? <Circle className="mr-2 h-4 w-4 text-amber-500" /> : <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />}
                        <span>Mark as {isPaid ? 'Pending' : 'Paid'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem 
                        onClick={(e) => { e.preventDefault(); setIsDeleteOpen(true); }}
                        className="text-red-400 focus:bg-red-950 focus:text-red-300 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Referral</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Referral Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="bg-zinc-950 border-red-900/50 shadow-2xl shadow-red-900/20 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            Delete Referral?
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 mt-4 leading-relaxed">
                            Are you absolutely sure you want to delete the referral for <strong className="text-zinc-200">{referral.customer_email || 'Unknown'}</strong>? 
                            This action cannot be undone. Associated commissions will also be deleted if constrained.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 border-t border-zinc-900 pt-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsDeleteOpen(false)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-500 text-white font-medium shadow-none"
                        >
                            {isUpdating ? "Deleting..." : "Delete Referral"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
