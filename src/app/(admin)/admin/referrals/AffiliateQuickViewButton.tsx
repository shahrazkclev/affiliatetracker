'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, Mail, Tag, BarChart2, DollarSign, MousePointerClick, Calendar } from 'lucide-react';
import { AffiliateEditDialog } from '@/app/(admin)/admin/affiliates/AffiliateEditDialog';

export type QuickViewAffiliate = {
    id: string;
    name: string;
    email: string;
    status: string | null;
    referral_code: string | null;
    ref_code: string | null;
    clicks: number | null;
    total_commission: number | null;
    total_revenue?: number | null;
    created_at: string;
};


function StatusBadge({ status }: { status: string | null }) {
    const map: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        banned: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    const cls = map[status ?? ''] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider border ${cls}`}>
            {status ?? 'unknown'}
        </span>
    );
}

function Stat({ icon: Icon, label, value, accent }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    accent?: string;
}) {
    return (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${accent ?? 'text-zinc-400'}`} />
            </div>
            <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{label}</div>
                <div className={`text-sm font-semibold font-mono ${accent ?? 'text-zinc-200'}`}>{value}</div>
            </div>
        </div>
    );
}

export function AffiliateQuickViewButton({
    affiliate,
    compact = false,
    campaigns = [],
}: {
    affiliate: QuickViewAffiliate & { campaign_id?: string | null };
    compact?: boolean;
    campaigns?: any[];
}) {
    const [open, setOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const code = affiliate.referral_code || affiliate.ref_code || '—';
    const joined = new Date(affiliate.created_at).toLocaleDateString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
    });

    const campaign = campaigns.find(c => c.id === affiliate.campaign_id);
    const campaignName = campaign?.name ? (campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name) : 'Default';
    const campaignPercent = campaign?.default_commission_percent || 20;

    return (
        <>
            {compact ? (
                <button
                    onClick={() => setOpen(true)}
                    className="text-[11px] text-zinc-500 hover:text-amber-400 transition-colors duration-150 truncate flex items-center justify-between gap-2"
                >
                    <span>via {affiliate.name}</span>
                    <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">{campaignName} ({campaignPercent}%)</span>
                </button>
            ) : (
            <button
                onClick={() => setOpen(true)}
                className="text-left group/btn"
            >
                <div className="font-medium text-zinc-200 group-hover/btn:text-amber-400 transition-colors duration-150 underline decoration-zinc-700 decoration-dotted underline-offset-2 hover:decoration-amber-400">
                    {affiliate.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-zinc-500 text-xs font-mono">{affiliate.email}</span>
                    <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider group-hover/btn:text-amber-400 group-hover/btn:border-amber-500/30 transition-colors">
                        {campaignName} ({campaignPercent}%)
                    </span>
                </div>
            </button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl max-w-md">
                    {/* Ambient glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    <DialogHeader className="space-y-1 pb-4 border-b border-zinc-800">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-xl font-bold text-zinc-100 tracking-tight">
                                    {affiliate.name}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <StatusBadge status={affiliate.status} />
                                    <span className="text-zinc-500 text-xs font-mono">{affiliate.email}</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <Stat icon={Tag} label="Ref Code" value={code} accent="text-amber-400" />
                        <Stat
                            icon={Calendar}
                            label="Joined"
                            value={joined}
                        />
                        <Stat
                            icon={DollarSign}
                            label="Revenue Est."
                            value={`$${Number((affiliate.total_revenue ?? affiliate.total_commission ?? 0) * (affiliate.total_revenue ? 1 : 3.33)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            accent="text-zinc-200"
                        />

                        <Stat
                            icon={BarChart2}
                            label="Commission"
                            value={`$${Number(affiliate.total_commission ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            accent="text-emerald-400"
                        />
                        <Stat
                            icon={MousePointerClick}
                            label="Clicks"
                            value={affiliate.clicks ?? 0}
                        />
                        <Stat
                            icon={Mail}
                            label="Email"
                            value={<span className="break-all text-xs">{affiliate.email}</span>}
                        />

                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex justify-end">
                        <button
                            onClick={() => { setOpen(false); setIsEditOpen(true); }}
                            className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Edit Affiliate
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit dialog — opens on top of (or after closing) quick view */}
            <AffiliateEditDialog
                affiliate={affiliate}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                campaigns={campaigns}
            />
        </>
    );
}
