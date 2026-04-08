'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Loader2, CircleCheck, CircleX, ChevronRight, AlertCircle, Trash2 } from "lucide-react";
import { saveCustomDomain, getCustomDomainStatus, removeCustomDomain } from "./cloudflare-actions";

export function CustomDomainCard({ 
    currentDomain,
    onDomainChange,
    onStatusChange
}: { 
    currentDomain: string | null;
    onDomainChange: (domain: string | null) => void;
    onStatusChange: (status: string | null) => void;
}) {
    const [domain, setDomain] = useState(currentDomain || '');
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const [hasConfiguredDns, setHasConfiguredDns] = useState(false);
    
    // Status tracking for existing domains
    const [domainStatus, setDomainStatus] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(currentDomain ? true : false);
    const [validationData, setValidationData] = useState<any>(null);

    useEffect(() => {
        if (currentDomain) {
            getCustomDomainStatus(currentDomain).then(res => {
                setDomainStatus(res.status);
                onStatusChange(res.status);
                if (res.ssl?.validation_records) setValidationData(res.ssl.validation_records[0]);
                setIsChecking(false);
            });
        } else {
            onStatusChange(null);
        }
    }, [currentDomain]);

    async function handleRemove() {
        if (!currentDomain || !confirm("Are you sure you want to completely remove this custom domain map?")) return;
        setMsg(null);
        startTransition(async () => {
            const res = await removeCustomDomain(currentDomain);
            if (res.success) {
                setDomain('');
                onDomainChange(null);
                onStatusChange(null);
                setValidationData(null);
            } else {
                setMsg({ ok: false, text: res.error || 'Failed to remove domain.' });
            }
        });
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
            const res = await saveCustomDomain(domain);
            if (res.success) {
                setMsg({ ok: true, text: 'Custom domain bound properly!' });
                onDomainChange(domain);
                setIsChecking(true);
                // Background check instantly
                const stat = await getCustomDomainStatus(domain);
                setDomainStatus(stat.status);
                onStatusChange(stat.status);
                if (stat.ssl?.validation_records) setValidationData(stat.ssl.validation_records[0]);
                setIsChecking(false);
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
                {currentDomain ? (
                    <div className="space-y-4">
                        <div className="bg-black/20 border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-mono text-purple-400 select-all">{currentDomain}</h3>
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                    {isChecking ? (
                                        <><Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" /><span className="text-zinc-500">Checking status with Cloudflare...</span></>
                                    ) : domainStatus === 'active' ? (
                                        <><CircleCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500 font-medium tracking-wide">Active & Secured</span></>
                                    ) : domainStatus === 'pending_validation' || domainStatus === 'pending' ? (
                                        <><Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" /><span className="text-yellow-500 font-medium tracking-wide">Pending DNS Propagation</span></>
                                    ) : (
                                        <><AlertCircle className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500 font-medium">{domainStatus === 'unknown' ? 'Not Foud' : 'Error / Disconnected'}</span></>
                                    )}
                                </div>
                            </div>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={handleRemove}
                                disabled={isPending}
                                className="bg-red-950/40 text-red-400 hover:bg-red-950/80 hover:text-red-300 border border-red-900/50"
                            >
                                {isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-2" />}
                                Remove Domain
                            </Button>
                        </div>
                        
                        {validationData?.txt_name && (domainStatus === 'pending_validation' || domainStatus === 'pending') && (
                            <div className="mt-4 p-4 bg-zinc-950/50 border border-amber-500/20 rounded-md">
                                <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> DNS TXT Verification Required
                                </h4>
                                <p className="text-xs text-zinc-400 mb-3">Your custom domain mapping requires a secondary layer of authentication via TXT validation. Please add this record urgently to issue your SSL Certificate!</p>
                                <div className="grid grid-cols-[100px_1fr] gap-3 text-xs w-full overflow-hidden items-center text-zinc-300">
                                    <span className="text-zinc-500">Record Type</span>
                                    <span className="font-mono bg-black/40 px-2 py-1 rounded w-max border border-zinc-800">TXT</span>
                                    
                                    <span className="text-zinc-500">Name</span>
                                    <div className="font-mono bg-black/40 px-2 py-1 rounded border border-zinc-800 overflow-x-auto whitespace-nowrap scrollbar-hide text-purple-400">{validationData.txt_name}</div>
                                    
                                    <span className="text-zinc-500">Value</span>
                                    <div className="font-mono bg-black/40 px-2 py-1 rounded border border-zinc-800 break-all">{validationData.txt_value}</div>
                                </div>
                            </div>
                        )}
                        
                        {msg && (
                            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                                msg.ok ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' : 'bg-red-950/30 border-red-500/20 text-red-400'
                            }`}>
                                {msg.ok ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleX className="w-3.5 h-3.5 shrink-0" />}
                                {msg.text}
                            </div>
                        )}
                    </div>
                ) : (
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
                         <p className="text-[10px] text-zinc-500 mt-2 leading-tight">
                            <strong className="text-zinc-400">Note:</strong> Global DNS propagation typically begins within a few minutes, but can take up to 24 hours. Cloudflare may request a secondary TXT validation post-submission.
                         </p>
                    </div>

                    <div className="flex items-start space-x-3 bg-black/20 p-3 rounded-md border border-zinc-800/80">
                        <Checkbox 
                            id="dns-confirm" 
                            className="mt-0.5 border-zinc-600 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white"
                            checked={hasConfiguredDns}
                            onCheckedChange={(checked) => setHasConfiguredDns(checked === true)}
                        />
                        <div className="grid leading-none">
                            <label htmlFor="dns-confirm" className="text-xs font-medium text-zinc-300 leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I confirm I have successfully added the CNAME record in my provider.
                            </label>
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
                        disabled={isPending || !hasConfiguredDns || !domain}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-9 text-sm focus-visible:ring-purple-500 focus-visible:ring-opacity-50 disabled:opacity-50"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Binding Hostname...</>
                        ) : (
                            <><Globe className="w-4 h-4 mr-2" /> Connect Domain</>
                        )}
                    </Button>
                </form>
                )}
            </CardContent>
        </Card>
    );
}
