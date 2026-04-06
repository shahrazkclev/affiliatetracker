'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    CreditCard, Plug, PlugZap, CircleCheck, CircleX,
    Loader2, Eye, EyeOff, Zap, Shield
} from "lucide-react";
import {
    saveStripeConnection, disconnectStripe, getStripeStatus,
} from "./stripe-actions";

type Status = {
    connected: boolean;
    displayName?: string;
    mode?: 'live' | 'test';
    webhookId?: string | null;
    webhookUrl?: string | null;
    appUrl?: string | null;
} | null;

export function StripeConnectCard() {
    const [status, setStatus] = useState<Status>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Connect form state
    const [keyInput, setKeyInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [connectMsg, setConnectMsg] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        setLoading(true);
        const s = await getStripeStatus();
        setStatus(s as Status);
        setUrlInput(s.appUrl || '');
        setLoading(false);
    }

    async function handleConnect(e: React.FormEvent) {
        e.preventDefault();
        setConnectMsg(null);
        const fd = new FormData(e.target as HTMLFormElement);
        startTransition(async () => {
            const res = await saveStripeConnection(fd);
            if (res.success) {
                setConnectMsg({ ok: true, text: res.message || 'Connected successfully!' });
                setKeyInput('');
                await fetchStatus();
            } else {
                setConnectMsg({ ok: false, text: res.error || 'Failed to connect' });
            }
        });
    }

    async function handleDisconnect() {
        if (!confirm('Are you sure? This will delete the registered webhook from Stripe.')) return;
        startTransition(async () => {
            const res = await disconnectStripe();
            if (res.success) {
                setStatus({ connected: false });
                setConnectMsg({ ok: true, text: 'Stripe disconnected successfully.' });
            } else {
                setConnectMsg({ ok: false, text: res.error || 'Failed to disconnect' });
            }
        });
    }

    if (loading) {
        return (
            <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden">
                <CardContent className="pt-6 flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking Stripe connection...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Stripe Integration
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                    Connect Stripe to auto-register webhooks and track commissions
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">

                {/* Status Banner */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    status?.connected
                        ? 'bg-emerald-950/40 border-emerald-500/20'
                        : 'bg-zinc-950 border-zinc-800'
                }`}>
                    {status?.connected ? (
                        <>
                            <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-emerald-300">
                                    Connected {status.displayName ? `— ${status.displayName}` : ''}
                                    {status.mode && (
                                        <span className={`ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                            status.mode === 'live'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                        }`}>{status.mode}</span>
                                    )}
                                </p>
                                {status.webhookUrl && (
                                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                                        Webhook → {status.webhookUrl}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={isPending}
                                className="text-red-400 border-red-500/30 hover:bg-red-950/50 hover:text-red-300 h-7 text-xs"
                            >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3 mr-1" />}
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <>
                            <CircleX className="w-5 h-5 text-zinc-600 shrink-0" />
                            <p className="text-sm text-zinc-500">Not connected</p>
                        </>
                    )}
                </div>

                {/* Connect Form */}
                <form onSubmit={handleConnect} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Stripe Secret Key
                        </Label>
                        <div className="relative">
                            <Input
                                name="stripe_secret_key"
                                type={showKey ? 'text' : 'password'}
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder="sk_live_... or sk_test_..."
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm pr-10 focus-visible:ring-indigo-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Your App URL
                        </Label>
                        <Input
                            name="app_url"
                            type="url"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder="https://your-app.com"
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-indigo-500/50"
                        />
                        <p className="text-[10px] text-zinc-600 font-mono">
                            Webhook will be registered at: {urlInput || 'your-url'}/api/webhooks/stripe
                        </p>
                    </div>

                    {connectMsg && (
                        <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${
                            connectMsg.ok
                                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-950/30 border-red-500/20 text-red-400'
                        }`}>
                            {connectMsg.ok ? <CircleCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <CircleX className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            <span>{connectMsg.text}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending || !keyInput}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-9 text-sm"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                        ) : (
                            <><PlugZap className="w-4 h-4 mr-2" /> {status?.connected ? 'Update Connection' : 'Connect Stripe'}</>
                        )}
                    </Button>
                </form>

                {/* What Happens Info */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-600">
                    {[
                        { icon: Shield, label: 'Key verified against Stripe API' },
                        { icon: Zap, label: 'Webhook auto-registered' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1 bg-zinc-950/50 rounded-lg p-2 border border-zinc-800 text-center">
                            <Icon className="w-3.5 h-3.5 text-indigo-400/60" />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
