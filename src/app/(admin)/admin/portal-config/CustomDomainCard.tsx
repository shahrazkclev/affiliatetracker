'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Loader2, CircleCheck, CircleX, ChevronRight } from "lucide-react";
import { saveCustomDomain } from "./cloudflare-actions";

export function CustomDomainCard({ currentDomain }: { currentDomain: string | null }) {
    const [domain, setDomain] = useState(currentDomain || '');
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
            const res = await saveCustomDomain(domain);
            if (res.success) {
                setMsg({ ok: true, text: 'Custom domain bound properly!' });
            } else {
                setMsg({ ok: false, text: res.error || 'Failed to bind domain.' });
            }
        });
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" /> Affiliate Portal Custom Domain
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                    Allow your partners to access their portal via your own branded subdomain.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Enter Custom Domain
                        </Label>
                        <Input
                            type="text"
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            placeholder="partners.yourcompany.com"
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm focus-visible:ring-purple-500/50"
                        />
                    </div>
                
                    {/* Setup Instructions */}
                    <div className="bg-purple-950/20 border border-purple-500/10 p-3 rounded-md space-y-2">
                         <p className="text-xs text-zinc-300 font-medium tracking-wide">DNS Instructions</p>
                         <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Create a CNAME record in your DNS provider pointing your subdomain to:
                         </p>
                         <div className="flex items-center gap-2 mt-1 bg-black/40 px-3 py-1.5 rounded border border-zinc-800">
                             <span className="text-[10px] text-zinc-400 font-mono">CNAME</span>
                             <ChevronRight className="w-3 h-3 text-zinc-600" />
                             <span className="text-xs text-purple-400 font-mono select-all">portal.affiliatemango.com</span>
                         </div>
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
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-9 text-sm"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Binding Hostname...</>
                        ) : (
                            <><Globe className="w-4 h-4 mr-2" /> Connect Domain</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
