'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Bell, Loader2, CircleCheck, CircleX, Info } from "lucide-react";
import { requestPayout, savePayoutThreshold } from "./payout-actions";

export function PortalPayoutActions({
    affiliateId,
    unpaid,
    currentThreshold,
    hasPendingRequest,
}: {
    affiliateId: string;
    unpaid: number;
    currentThreshold: number;
    hasPendingRequest: boolean;
}) {
    const [isPayoutPending, startPayoutTransition] = useTransition();
    const [isThresholdPending, startThresholdTransition] = useTransition();
    const [requestMsg, setRequestMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [thresholdMsg, setThresholdMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [threshold, setThreshold] = useState(currentThreshold.toString());

    async function handleRequestPayout() {
        setRequestMsg(null);
        if (unpaid <= 0) {
            setRequestMsg({ ok: false, text: 'No unpaid balance to request.' });
            return;
        }
        startPayoutTransition(async () => {
            const res = await requestPayout(affiliateId, unpaid);
            if (res.success) {
                setRequestMsg({ ok: true, text: `Payout request of $${unpaid.toFixed(2)} sent to admin.` });
            } else {
                setRequestMsg({ ok: false, text: res.error || 'Failed to send request.' });
            }
        });
    }

    async function handleSaveThreshold(e: React.FormEvent) {
        e.preventDefault();
        setThresholdMsg(null);
        const val = parseFloat(threshold);
        if (isNaN(val) || val < 0) {
            setThresholdMsg({ ok: false, text: 'Enter a valid amount (0 to disable)' });
            return;
        }
        startThresholdTransition(async () => {
            const res = await savePayoutThreshold(affiliateId, val);
            if (res.success) {
                setThresholdMsg({ ok: true, text: val > 0 ? `Auto-alert set at $${val.toFixed(2)}` : 'Auto-alert disabled.' });
            } else {
                setThresholdMsg({ ok: false, text: res.error || 'Failed to save threshold.' });
            }
        });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request Payout Card */}
            <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Request Payout
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-zinc-500 font-mono mb-1 uppercase tracking-wider">You'll receive</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">
                            ${(unpaid * 0.965).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">
                            After 3.5% Stripe fee (${(unpaid * 0.035).toFixed(2)}) from ${unpaid.toFixed(2)} balance
                        </p>
                    </div>

                    {hasPendingRequest && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-lg">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            You have a pending payout request. Admin will process it soon.
                        </div>
                    )}

                    {requestMsg && (
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                            requestMsg.ok
                                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-950/30 border-red-500/20 text-red-400'
                        }`}>
                            {requestMsg.ok ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleX className="w-3.5 h-3.5" />}
                            {requestMsg.text}
                        </div>
                    )}

                    <Button
                        type="button"
                        onClick={handleRequestPayout}
                        disabled={isPayoutPending || unpaid <= 0 || hasPendingRequest}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold h-10 text-sm disabled:opacity-50"
                    >
                        {isPayoutPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                        ) : (
                            <><ArrowUpRight className="w-4 h-4 mr-2" /> Request Payout</>
                        )}
                    </Button>
                    <p className="text-[10px] text-zinc-600 text-center font-mono">Admin will be notified immediately</p>
                </CardContent>
            </Card>

            {/* Auto-Alert Threshold Card */}
            <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-400" /> Auto-Alert Threshold
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <p className="text-xs text-zinc-500 font-mono">
                        Set a threshold — when your unpaid balance crosses it, admin is automatically notified and you won't need to request manually each time.
                    </p>
                    <form onSubmit={handleSaveThreshold} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Alert me when balance exceeds</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
                                <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={threshold}
                                    onChange={e => setThreshold(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-orange-400 font-mono font-semibold pl-7 focus-visible:ring-indigo-500/50"
                                    placeholder="0 = disabled"
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 font-mono">Set to 0 to disable auto-alerts</p>
                        </div>

                        {thresholdMsg && (
                            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                                thresholdMsg.ok
                                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-950/30 border-red-500/20 text-red-400'
                            }`}>
                                {thresholdMsg.ok ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleX className="w-3.5 h-3.5" />}
                                {thresholdMsg.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isThresholdPending}
                            className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-semibold h-9 text-sm"
                        >
                            {isThresholdPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : (
                                <><Bell className="w-4 h-4 mr-2" /> Save Threshold</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
