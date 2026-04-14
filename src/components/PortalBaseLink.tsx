"use client";

import { Link, Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

export function PortalBaseLink({ baseUrl }: { baseUrl: string }) {
    const [baseCopied, setBaseCopied] = useState(false);
    
    async function copyBase() {
        await navigator.clipboard.writeText(baseUrl);
        setBaseCopied(true);
        setTimeout(() => setBaseCopied(false), 2000);
    }
    
    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-orange-400" /> Your Referral Link
                </p>
                <button onClick={copyBase} className="text-[10px] text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                    {baseCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {baseCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-orange-400 break-all">
                {baseUrl || <span className="text-zinc-600">No ref code set — contact support</span>}
            </div>
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-zinc-400">
                    Payouts are subject to a{' '}
                    <span className="text-amber-400 font-semibold font-mono">3.5% Stripe transfer fee</span>{' '}
                    deducted from your gross commission.
                    Example: if you earn <span className="font-mono text-zinc-200">$100.00</span>, you receive{' '}
                    <span className="text-emerald-400 font-semibold font-mono">$96.50</span> net.
                </p>
            </div>
        </div>
    );
}
