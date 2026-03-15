'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, CheckCircle2, XCircle } from "lucide-react";
import { updateCommissionStatus } from "@/app/actions/admin";

export function CommissionsActionsCell({ commission }: { commission: any }) {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState<'paid' | 'void' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleStatusChange() {
        if (!targetStatus) return;
        setIsLoading(true);
        try {
            await updateCommissionStatus(commission.id, targetStatus);
            setIsStatusOpen(false);
        } catch (error) {
            console.error("Status update failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    const confirmStatusChange = (status: 'paid' | 'void') => {
        setTargetStatus(status);
        setIsStatusOpen(true);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 transition-colors mx-auto active:scale-95">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setIsViewOpen(true)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                        className="hover:bg-zinc-900 cursor-pointer text-emerald-400 hover:text-emerald-300"
                        onClick={() => confirmStatusChange('paid')}
                        disabled={commission.status === 'paid'}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="hover:bg-zinc-900 cursor-pointer text-red-400 hover:text-red-300"
                        onClick={() => confirmStatusChange('void')}
                        disabled={commission.status === 'void'}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Void Transaction
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* View Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <Eye className="w-5 h-5 text-emerald-500" />
                            Commission Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Transaction ID</span>
                                <p className="font-mono text-zinc-300 break-all">{commission.id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Date</span>
                                <p className="font-mono text-zinc-300">{new Date(commission.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Affiliate Node</span>
                                <p className="font-medium text-zinc-200">{commission.affiliate?.name || 'Unknown'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Affiliate ID</span>
                                <p className="font-mono text-xs text-zinc-500">{commission.affiliate_id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Status</span>
                                <div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                        ${commission.status === 'paid' || commission.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            commission.status === 'void' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                        {commission.status}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Amount</span>
                                <p className="font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                    ${Number(commission.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${targetStatus === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {targetStatus === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {targetStatus === 'paid' ? 'Mark as Paid' : 'Void Commission'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to change this commission of <strong className="text-zinc-200 font-mono">${Number(commission.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> to <strong>{targetStatus}</strong>?
                            {targetStatus === 'void' && ' This will remove the value from the affiliate\'s pending balance.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsStatusOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleStatusChange} disabled={isLoading} className={targetStatus === 'paid' ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" : "bg-red-600 hover:bg-red-500 text-white font-semibold"}>
                            {isLoading ? "Processing..." : `Yes, ${targetStatus === 'paid' ? 'Mark Paid' : 'Void'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
