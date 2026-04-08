'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Loader2, CircleCheck, CircleX } from "lucide-react";
import { saveSmtpSettings } from "./smtp-settings-actions";

export function SmtpSettingsCard({ currentConfig }: { currentConfig: any }) {
    const [host, setHost] = useState(currentConfig?.smtp_host || '');
    const [port, setPort] = useState(currentConfig?.smtp_port?.toString() || '');
    const [userStr, setUserStr] = useState(currentConfig?.smtp_user || '');
    const [pass, setPass] = useState(currentConfig?.smtp_pass || '');
    const [fromEmail, setFromEmail] = useState(currentConfig?.smtp_from_email || '');
    
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
            const res = await saveSmtpSettings(host, port, userStr, pass, fromEmail);
            setMsg({ ok: res.success, text: res.success ? 'SMTP Settings Saved Successfully!' : (res.error || 'Failed to save.') });
        });
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" /> Custom SMTP Configuration
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                    Send platform emails (invites, payout limits) through your own domain explicitly.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">SMTP Host</Label>
                            <Input
                                type="text"
                                value={host}
                                onChange={e => setHost(e.target.value)}
                                placeholder="smtp.gmail.com"
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-cyan-500/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Port</Label>
                            <Input
                                type="text"
                                value={port}
                                onChange={e => setPort(e.target.value)}
                                placeholder="587"
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-cyan-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Username</Label>
                            <Input
                                type="text"
                                value={userStr}
                                onChange={e => setUserStr(e.target.value)}
                                placeholder="apikey or admin@site.com"
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-cyan-500/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Password</Label>
                            <Input
                                type="password"
                                value={pass}
                                onChange={e => setPass(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-cyan-500/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Send From Email</Label>
                        <Input
                            type="email"
                            value={fromEmail}
                            onChange={e => setFromEmail(e.target.value)}
                            placeholder="partners@yourbrand.com"
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-cyan-500/50"
                        />
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">Ensure this matches your authenticated domain records.</p>
                    </div>

                    {msg && (
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                            msg.ok
                                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-950/30 border-red-500/20 text-red-400'
                        }`}>
                            {msg.ok ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleX className="w-3.5 h-3.5 shrink-0" />}
                            {msg.text}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold h-9 text-sm"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Configuration...</>
                        ) : (
                            <><Server className="w-4 h-4 mr-2" /> Save SMTP Credentials</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
