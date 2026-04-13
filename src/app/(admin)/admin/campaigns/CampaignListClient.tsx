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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setEditingCampaign(c)}
                        className="group block w-full text-left h-full"
                    >
                        <Card className="bg-zinc-900 border-zinc-800/80 shadow-lg hover:border-orange-500/40 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                            
                            <CardContent className="py-6 px-6 flex flex-col flex-grow z-10 relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${c.is_default ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-zinc-700'}`} />
                                        <span className="font-bold text-zinc-100 text-lg tracking-tight">{c.name}</span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 text-zinc-500 group-hover:text-orange-400 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                </div>
                                
                                {c.is_default && (
                                    <div className="mb-4">
                                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                            Default
                                        </span>
                                    </div>
                                )}
                                
                                <div className="space-y-4 mt-auto">
                                    <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Commission</span>
                                        <span className="text-orange-400 font-bold font-mono text-base">{c.default_commission_percent || 0}%</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-zinc-800/50">
                                        <div>
                                            <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Cookie Window</span>
                                            <span className="text-sm text-zinc-300 font-medium">{c.cookie_days ? `${c.cookie_days} days` : 'Default'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-1">
                                        <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Target URL</span>
                                        {c.landing_url ? (
                                            <span className="text-xs text-zinc-400 font-mono truncate block" title={c.landing_url}>
                                                {c.landing_url.replace(/^https?:\/\//, '')}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-zinc-600 font-mono italic">Inherits global link</span>
                                        )}
                                    </div>
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
