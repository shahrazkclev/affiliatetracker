'use client';

import { useState, useTransition } from 'react';
import { BellRing, Check, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { dismissPayoutRequest, resolvePayoutRequest } from './payout-request-actions';
import { toast } from 'sonner';

type PayoutRequest = {
    id: string;
    amount: number;
    created_at: string;
    affiliate: {
        name: string;
        email: string;
        payout_threshold?: number;
        total_commission?: number;
    } | null;
};

export function PayoutRequestsPanel({ requests }: { requests: PayoutRequest[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = requests.filter(r => !dismissed.has(r.id));

    if (visible.length === 0) return null;

    return (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
                <BellRing className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                    {visible.length} Pending Payout Request{visible.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-2">
                {visible.map((req) => (
                    <PayoutRequestRow
                        key={req.id}
                        req={req}
                        onDone={() => setDismissed(prev => new Set([...prev, req.id]))}
                    />
                ))}
            </div>
        </div>
    );
}

function PayoutRequestRow({ req, onDone }: { req: PayoutRequest; onDone: () => void }) {
    const [isResolvePending, startResolveTransition] = useTransition();
    const [isDismissPending, startDismissTransition] = useTransition();

    function handleResolve() {
        startResolveTransition(async () => {
            const res = await resolvePayoutRequest(req.id);
            if (res.success) {
                toast.success(`Marked ${req.affiliate?.name || 'affiliate'}'s request as paid.`);
                onDone();
            } else {
                toast.error(res.error || 'Failed to resolve request.');
            }
        });
    }

    function handleDismiss() {
        startDismissTransition(async () => {
            const res = await dismissPayoutRequest(req.id);
            if (res.success) {
                toast.success('Request dismissed.');
                onDone();
            } else {
                toast.error(res.error || 'Failed to dismiss request.');
            }
        });
    }

    return (
        <div className="flex items-center justify-between bg-zinc-950/60 border border-amber-500/10 rounded-lg px-4 py-3 gap-4">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-200 truncate">{req.affiliate?.name || '—'}</p>
                <p className="text-zinc-500 text-xs font-mono truncate">{req.affiliate?.email || '—'}</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <p className="text-amber-300 font-mono font-bold text-sm">
                    ${Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleResolve}
                    disabled={isResolvePending || isDismissPending}
                    className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3"
                >
                    {isResolvePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Paid</>}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDismiss}
                    disabled={isResolvePending || isDismissPending}
                    className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 px-3"
                >
                    {isDismissPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Dismiss</>}
                </Button>
            </div>
        </div>
    );
}
