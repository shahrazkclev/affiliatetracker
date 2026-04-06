'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { CampaignEditDialog } from './CampaignEditDialog';

type Campaign = {
    id: string;
    name: string;
    landing_url: string | null;
    default_commission_percent: number | null;
    is_default: boolean | null;
    cookie_days: number | null;
    require_approval: boolean | null;
    show_customer_email: boolean;
};

export function CampaignListClient({ campaigns }: { campaigns: Campaign[] }) {
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

    return (
        <>
            <div className="grid gap-4">
                {campaigns.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setEditingCampaign(c)}
                        className="group block w-full text-left"
                    >
                        <Card className="bg-zinc-900 border-zinc-800/80 shadow-lg hover:border-orange-500/40 hover:shadow-orange-500/5 transition-all duration-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="py-5 px-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2.5 h-2.5 rounded-full ${c.is_default ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-zinc-600'}`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-zinc-100">{c.name}</span>
                                            {c.is_default && (
                                                <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-xs text-zinc-500 font-mono">
                                                Commission: <span className="text-orange-400 font-semibold">{c.default_commission_percent || 0}%</span>
                                            </span>
                                            {c.cookie_days && (
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    Cookie: <span className="text-zinc-300">{c.cookie_days}d</span>
                                                </span>
                                            )}
                                            {c.landing_url && (
                                                <span className="text-xs text-zinc-500 font-mono truncate max-w-[260px]" title={c.landing_url}>
                                                    🔗 <span className="text-zinc-400">{c.landing_url}</span>
                                                </span>
                                            )}
                                            {!c.landing_url && (
                                                <span className="text-xs text-zinc-700 font-mono italic">No link set</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600 group-hover:text-orange-400 transition-colors">
                                    <Settings className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-wider">Edit</span>
                                </div>
                            </CardContent>
                        </Card>
                    </button>
                ))}
            </div>

            {editingCampaign && (
                <CampaignEditDialog
                    campaign={editingCampaign}
                    open={!!editingCampaign}
                    onOpenChange={(open) => { if (!open) setEditingCampaign(null); }}
                />
            )}
        </>
    );
}
