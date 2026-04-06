'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, CircleCheck, CircleX } from "lucide-react";
import { savePayoutNotificationEmail } from "./payout-settings-actions";

export function PayoutEmailCard({ currentEmail }: { currentEmail: string | null }) {
    const [email, setEmail] = useState(currentEmail || '');
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
            const res = await savePayoutNotificationEmail(email.trim());
            setMsg({ ok: res.success, text: res.success ? 'Saved! Payout requests will be emailed here.' : (res.error || 'Failed to save.') });
        });
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
            <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-400" /> Payout Notification Email
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                    When an affiliate submits a payout request, this address gets notified. Defaults to org owner email.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
                <form onSubmit={handleSave} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Admin Notification Email
                        </Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@yourcompany.com"
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-orange-500/50"
                        />
                        <p className="text-[10px] text-zinc-600 font-mono">Leave empty to use the org owner's email.</p>
                    </div>

                    {msg && (
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                            msg.ok
                                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-950/30 border-red-500/20 text-red-400'
                        }`}>
                            {msg.ok ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleX className="w-3.5 h-3.5" />}
                            {msg.text}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold h-9 text-sm"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            <><Mail className="w-4 h-4 mr-2" /> Save Email</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
