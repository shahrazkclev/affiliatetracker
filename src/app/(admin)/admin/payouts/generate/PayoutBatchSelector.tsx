'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { markPayoutAsPaid } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Affiliate = {
    id: string;
    name: string;
    email: string;
    payout_email?: string | null;
    amount_owed: number;
    created_at: string;
};

export function PayoutBatchSelector({ affiliates }: { affiliates: Affiliate[] }) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [doneCount, setDoneCount] = useState(0);

    const allSelected = affiliates.length > 0 && selected.size === affiliates.length;

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(affiliates.map(a => a.id)));
        }
    }

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function executeSelected() {
        setIsProcessing(true);
        setDoneCount(0);
        const toProcess = affiliates.filter(a => selected.has(a.id));
        let errorCount = 0;

        for (const affiliate of toProcess) {
            const res = await markPayoutAsPaid(affiliate.id, affiliate.amount_owed, 'Batch payout');
            if (!res.success) {
                toast.error(`Failed to process payout for ${affiliate.name}: ${res.error}`);
                errorCount++;
            }
            setDoneCount(prev => prev + 1);
        }

        setIsProcessing(false);
        setConfirmOpen(false);
        setSelected(new Set());
        
        if (errorCount === 0) {
            toast.success(`Successfully processed ${toProcess.length} payout(s)`);
        } else if (errorCount < toProcess.length) {
            toast.success(`Processed ${toProcess.length - errorCount} payout(s) with ${errorCount} errors`);
        }

        // Soft reload data via Next.js RSC router
        router.refresh();
    }

    const totalSelected = affiliates
        .filter(a => selected.has(a.id))
        .reduce((sum, a) => sum + a.amount_owed, 0);

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between pt-2 mb-4">
                <p className="text-zinc-500 text-xs font-mono">
                    {affiliates.length} affiliates with pending commissions
                    {selected.size > 0 && (
                        <span className="text-amber-400 ml-2">· {selected.size} selected (${totalSelected.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                    )}
                </p>
                <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={selected.size === 0}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800/50 disabled:text-zinc-500 text-black font-semibold border border-amber-500/0 disabled:border-zinc-800 tracking-wide shadow-[0_0_16px_rgba(245,158,11,0.2)] disabled:shadow-none transition-all"
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Execute Selected {selected.size > 0 && `(${selected.size})`}
                </Button>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={toggleAll}
                                    className="border-zinc-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 rounded"
                                />
                            </th>
                            <th className="px-6 py-4">Affiliate</th>
                            <th className="px-6 py-4">Payout Email</th>
                            <th className="px-6 py-4">Amount Owed</th>
                            <th className="px-6 py-4">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {affiliates.length === 0 && (
                            <tr className="bg-zinc-950/30">
                                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
                                    No pending commissions found
                                </td>
                            </tr>
                        )}
                        {affiliates.map(affiliate => (
                            <tr
                                key={affiliate.id}
                                onClick={() => toggle(affiliate.id)}
                                className={`cursor-pointer hover:bg-zinc-800/30 transition-colors duration-200 border-l-2 ${selected.has(affiliate.id) ? 'border-amber-500 bg-amber-500/5' : 'border-transparent'}`}
                            >
                                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selected.has(affiliate.id)}
                                        onCheckedChange={() => toggle(affiliate.id)}
                                        className="border-zinc-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-zinc-200 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selected.has(affiliate.id) ? 'bg-amber-400' : 'bg-amber-500/40'}`} />
                                        {affiliate.name}
                                    </div>
                                    <div className="text-zinc-500 font-mono text-xs mt-0.5 ml-4">{affiliate.email}</div>
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{affiliate.payout_email || affiliate.email || '—'}</td>
                                <td className="px-6 py-4 font-mono font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                                    ${Number(affiliate.amount_owed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                    {new Date(affiliate.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirm dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-400">
                            <AlertCircle className="w-5 h-5" />
                            Confirm Batch Payout
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-1 space-y-2">
                            <span className="block">
                                You are about to mark <strong className="text-zinc-200">{selected.size} affiliate{selected.size !== 1 ? 's' : ''}</strong> as paid totalling{' '}
                                <strong className="text-amber-400 font-mono">${totalSelected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.
                                This will reset their outstanding balances.
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                Each affiliate will be sent an email confirmation of their payout.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    {isProcessing && (
                        <div className="flex items-center gap-3 text-sm text-zinc-400 py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            Processing {doneCount} / {selected.size}…
                        </div>
                    )}
                    <DialogFooter className="gap-2 mt-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isProcessing} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                            Cancel
                        </Button>
                        <Button onClick={executeSelected} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-500 text-black font-bold">
                            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : 'Confirm & Execute'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
