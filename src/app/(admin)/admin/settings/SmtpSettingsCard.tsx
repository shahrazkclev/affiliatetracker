'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Loader2, CircleCheck, CircleX } from "lucide-react";
import { saveSmtpSettings } from "./smtp-settings-actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

interface Props {
    currentConfig: any;
    hasSmtpAccess?: boolean;
}

export function SmtpSettingsCard({ currentConfig, hasSmtpAccess }: Props) {
    const router = useRouter();
    const [showFields, setShowFields] = useState<boolean>(
        hasSmtpAccess ? (currentConfig?.smtp_host !== null && currentConfig?.smtp_host !== undefined && currentConfig?.smtp_host !== '') : false
    );
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
            const res = await saveSmtpSettings(showFields ? host : null, showFields ? port : null, showFields ? userStr : null, showFields ? pass : null, showFields ? fromEmail : null);
            setMsg({ ok: res.success, text: res.success ? 'SMTP Settings Saved Successfully!' : (res.error || 'Failed to save.') });
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full"
        >
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:border-zinc-700/80">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <CardHeader className="pb-4 border-b border-zinc-800/50 relative z-10">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" /> Custom SMTP Configuration
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1 flex justify-between items-center">
                    <span>Send platform emails (invites, payout limits) through your own domain explicitly.</span>
                    {!hasSmtpAccess && (
                        <span className="flex items-center gap-1.5 text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                            <Lock className="w-3 h-3" /> PRO FEATURE
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4 relative">
                {!hasSmtpAccess && (
                    <div className="absolute inset-x-0 bottom-0 top-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-[2px] rounded-b-xl border-t border-zinc-800/50">
                        <div className="flex flex-col items-center text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-[280px] shadow-2xl">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
                                <Lock className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-2">Upgrade to Scale Plan</h3>
                            <p className="text-xs text-zinc-400 mb-4 font-normal">Custom SMTP configuration is only available on the Scale tier.</p>
                            <Link href="/admin/billing" className="w-full">
                                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-9 text-xs transition-colors shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                    View Options
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
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

                    <motion.div whileHover={{ scale: (isPending || !hasSmtpAccess) ? 1 : 1.01 }} whileTap={{ scale: (isPending || !hasSmtpAccess) ? 1 : 0.98 }}>
                        <Button
                            type="submit"
                            disabled={isPending || !hasSmtpAccess}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-10 text-sm transition-colors shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Configuration...</>
                            ) : (
                                <><Server className="w-4 h-4 mr-2" /> Save SMTP Credentials</>
                            )}
                        </Button>
                    </motion.div>
                </form>
            </CardContent>
        </Card>
        </motion.div>
    );
}
