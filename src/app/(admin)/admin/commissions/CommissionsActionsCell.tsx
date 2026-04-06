'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Eye, CheckCircle2, XCircle, Pencil, Trash2, DollarSign } from "lucide-react";
import { updateCommissionStatus, updateCommissionAmount, deleteCommission } from "@/app/actions/admin";

export function CommissionsActionsCell({ commission }: { commission: any }) {
    const [open, setOpen] = useState<'view' | 'edit' | 'status' | 'delete' | null>(null);
    const [targetStatus, setTargetStatus] = useState<'paid' | 'void' | null>(null);
    const [editAmount, setEditAmount] = useState<string>(String(Number(commission.amount).toFixed(2)));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleStatusChange() {
        if (!targetStatus) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await updateCommissionStatus(commission.id, targetStatus);
            if (!res?.success) setError(res?.error || 'Failed');
            else setOpen(null);
        } finally { setIsLoading(false); }
    }

    async function handleEditAmount() {
        const val = parseFloat(editAmount);
        if (isNaN(val) || val < 0) { setError('Enter a valid amount'); return; }
        setIsLoading(true);
        setError(null);
        try {
            const res = await updateCommissionAmount(commission.id, val);
            if (!res?.success) setError(res?.error || 'Failed');
            else setOpen(null);
        } finally { setIsLoading(false); }
    }

    async function handleDelete() {
        setIsLoading(true);
        setError(null);
        try {
            const res = await deleteCommission(commission.id);
            if (!res?.success) setError(res?.error || 'Failed');
            else setOpen(null);
        } finally { setIsLoading(false); }
    }

    const openStatus = (s: 'paid' | 'void') => { setTargetStatus(s); setOpen('status'); };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 transition-colors mx-auto active:scale-95">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200 min-w-[160px]">
                    <DropdownMenuLabel className="text-zinc-500">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-zinc-300" onClick={() => setOpen('view')}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-indigo-400 hover:text-indigo-300" onClick={() => { setEditAmount(String(Number(commission.amount).toFixed(2))); setOpen('edit'); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit Amount
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-emerald-400 hover:text-emerald-300" onClick={() => openStatus('paid')} disabled={commission.status === 'paid'}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-amber-400 hover:text-amber-300" onClick={() => openStatus('void')} disabled={commission.status === 'void'}>
                        <XCircle className="w-4 h-4 mr-2" /> Void Commission
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="hover:bg-zinc-900 cursor-pointer text-red-400 hover:text-red-300" onClick={() => setOpen('delete')}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Commission
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* View Details */}
            <Dialog open={open === 'view'} onOpenChange={v => !v && setOpen(null)}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                            <Eye className="w-5 h-5 text-emerald-500" /> Commission Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                        {[
                            ['Transaction ID', commission.id],
                            ['Date', new Date(commission.created_at).toLocaleString()],
                            ['Affiliate', commission.affiliate?.name || 'Unknown'],
                            ['Campaign', commission.campaign?.name || '—'],
                            ['Status', commission.status],
                            ['Amount', `$${Number(commission.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                        ].map(([label, val]) => (
                            <div key={label as string} className="space-y-1">
                                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">{label}</span>
                                <p className="font-mono text-zinc-300 break-all text-xs">{val}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Amount */}
            <Dialog open={open === 'edit'} onOpenChange={v => !v && setOpen(null)}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                            <Pencil className="w-5 h-5" /> Edit Commission
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">Manually edit or delete the commission amount</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Commission amount</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-200 font-mono focus-visible:ring-indigo-500/50"
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                    </div>
                    <DialogFooter className="flex flex-col gap-2 mt-2">
                        <Button onClick={handleEditAmount} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                            {isLoading ? 'Saving...' : 'Update Amount'}
                        </Button>
                        <Button variant="outline" onClick={() => openStatus('paid')} className="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                            Mark as Paid Out
                        </Button>
                        <Button onClick={() => setOpen('delete')} className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold">
                            Delete Commission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status change confirm */}
            <Dialog open={open === 'status'} onOpenChange={v => !v && setOpen(null)}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${targetStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {targetStatus === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {targetStatus === 'paid' ? 'Mark as Paid' : 'Void Commission'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Change commission of <strong className="text-zinc-200 font-mono">${Number(commission.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> to <strong>{targetStatus}</strong>?
                            {targetStatus === 'void' && ' This removes the value from the affiliate\'s pending balance.'}
                        </DialogDescription>
                    </DialogHeader>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setOpen(null)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleStatusChange} disabled={isLoading} className={targetStatus === 'paid' ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" : "bg-amber-600 hover:bg-amber-500 text-white font-semibold"}>
                            {isLoading ? 'Processing...' : `Yes, ${targetStatus === 'paid' ? 'Mark Paid' : 'Void'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={open === 'delete'} onOpenChange={v => !v && setOpen(null)}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-400">
                            <Trash2 className="w-5 h-5" /> Delete Commission
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Permanently delete this commission of <strong className="text-zinc-200 font-mono">${Number(commission.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>?
                            This will update all derived totals across the platform.
                        </DialogDescription>
                    </DialogHeader>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setOpen(null)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        <Button onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                            {isLoading ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
