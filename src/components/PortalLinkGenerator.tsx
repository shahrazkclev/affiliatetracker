'use client';

import { useState, useEffect } from 'react';
import { Link, ExternalLink, Plus, Trash2, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';

const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'Facebook', 'Blog', 'Podcast', 'Newsletter', 'Other'];

interface TrackingLink {
    id: string;
    label: string;
    platform: string;
    targetUrl: string;
    fullUrl: string;
    copied: boolean;
}

export function PortalLinkGenerator({
    baseUrl,
    refCode,
    affiliateId,
    clickCounts = {},
    tagAnalytics = {},
    initialLinks = [],
}: {
    baseUrl: string;
    refCode: string;
    affiliateId: string;
    clickCounts?: Record<string, number>;
    tagAnalytics?: Record<string, { referrals: number; revenue: number; commissions: number }>;
    initialLinks?: TrackingLink[];
}) {
    const [links, setLinks] = useState<TrackingLink[]>(initialLinks);
    const [isOpen, setIsOpen] = useState(false);
    const [platform, setPlatform] = useState('YouTube');
    const [label, setLabel] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [baseCopied, setBaseCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Sync if initialLinks changes from server
    useEffect(() => {
        if (initialLinks && initialLinks.length > 0) {
            setLinks(initialLinks.map((l: Omit<TrackingLink, 'copied'>) => ({ ...l, copied: false })));
        }
    }, [initialLinks]);

    async function persistLinks(updated: TrackingLink[]) {
        if (!affiliateId) return;
        setIsSaving(true);
        const supabase = createClient();
        const toSave = updated.map(({ copied: _c, ...rest }) => rest);
        await supabase
            .from('affiliates')
            .update({ custom_tracking_links: toSave })
            .eq('id', affiliateId);
        setIsSaving(false);
    }

    function buildUrl(target: string, tag: string) {
        let base = target || baseUrl;
        
        // Strip any existing via parameter to prevent duplicates
        try {
            const urlObj = new URL(base.startsWith('http') ? base : `https://${base}`);
            urlObj.searchParams.delete('via');
            base = urlObj.toString();
        } catch(e) {
            // fallback if URL parsing fails
            base = base.replace(/[?&]via=[^&]*/g, '');
        }

        const sep = base.includes('?') ? '&' : '?';
        const safeTag = tag.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
        // The webhook parses `refCode---tag---uuid` (the backend uses + replacing to splits). 
        // We will encode it as `refCode+tag` because track-click route reads `code.replace(/ /g, '+').split('+')`
        // Then the JS snippet sends it to Stripe.
        const viaValue = safeTag ? `${refCode}%2B${safeTag}` : refCode;
        return `${base}${sep}via=${viaValue}`;
    }

    async function addLink() {
        if (!label.trim()) return;
        const full = buildUrl(customUrl.trim(), label.trim());
        const newLink: TrackingLink = {
            id: crypto.randomUUID(),
            label: label.trim(),
            platform,
            targetUrl: customUrl.trim() || baseUrl,
            fullUrl: full,
            copied: false,
        };
        const updated = [...links, newLink];
        setLinks(updated);
        setLabel('');
        setCustomUrl('');
        setIsOpen(false);
        await persistLinks(updated);
    }

    async function removeLink(id: string) {
        const updated = links.filter(l => l.id !== id);
        setLinks(updated);
        await persistLinks(updated);
    }

    async function copyLink(id: string, url: string) {
        await navigator.clipboard.writeText(url);
        setLinks(prev => prev.map(l => l.id === id ? { ...l, copied: true } : l));
        setTimeout(() => setLinks(prev => prev.map(l => l.id === id ? { ...l, copied: false } : l)), 2000);
    }

    async function copyBase() {
        await navigator.clipboard.writeText(baseUrl);
        setBaseCopied(true);
        setTimeout(() => setBaseCopied(false), 2000);
    }

    return (
        <div className="space-y-3">

            {/* Custom tracking links */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" /> Custom Tracking Links
                        {isSaving && <Loader2 className="w-3 h-3 text-zinc-500 animate-spin ml-1" />}
                    </p>
                    <button
                        onClick={() => setIsOpen(v => !v)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" /> New Link
                    </button>
                </div>

                {loadError && <p className="text-xs text-red-400">{loadError}</p>}

                {isOpen && (
                    <div className="border border-zinc-800 rounded-lg p-3 space-y-3 bg-zinc-950/60">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">Source Tag</Label>
                                <Input
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. tutorial3, youtube, post1"
                                    className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 focus-visible:ring-orange-500/50"
                                />
                                <p className="text-[10px] text-zinc-600">Appended as {refCode}+<em>tag</em> in the link</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">Platform</Label>
                                <select
                                    value={platform}
                                    onChange={e => setPlatform(e.target.value)}
                                    className="w-full h-8 text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                >
                                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        {label && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Preview</p>
                                <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 font-mono text-[10px] text-indigo-400 break-all">
                                    {buildUrl(customUrl.trim(), label.trim())}
                                </div>
                                <p className="text-[10px] text-zinc-600">
                                    Tracking reads: affiliate=<span className="text-orange-400">{refCode}</span> source=<span className="text-indigo-400">{label.toLowerCase().replace(/[^a-z0-9_-]/g, '')}</span>
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button size="sm" onClick={addLink} disabled={isSaving || !label.trim()} className="h-7 text-xs bg-orange-600 hover:bg-orange-500 text-black font-semibold">
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add Link'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {links.length === 0 && !isOpen && (
                    <p className="text-zinc-600 text-xs text-center py-3">
                        No custom links yet. Create one per platform or video to track your stats independently.
                    </p>
                )}

                {links.length > 0 && (
                    <div className="space-y-2">
                        {links.map(link => {
                            const tag = link.label.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
                            const clicks = clickCounts[tag] || 0;
                            const stats = tagAnalytics[tag] || { referrals: 0, revenue: 0, commissions: 0 };
                            return (
                                <div key={link.id} className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-zinc-200">{link.label}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">{link.platform}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${clicks > 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                                {clicks} Clicks
                                            </span>
                                            {stats.referrals > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                    {stats.referrals} Signups
                                                </span>
                                            )}
                                            {stats.revenue > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border bg-amber-500/10 text-amber-400 border-amber-500/20">
                                                    Rev: ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-mono text-[10px] text-indigo-400 truncate">{link.fullUrl}</p>
                                    </div>
                                    <button
                                        onClick={() => copyLink(link.id, link.fullUrl)}
                                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-orange-400 transition-colors shrink-0"
                                    >
                                        {link.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => removeLink(link.id)}
                                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
