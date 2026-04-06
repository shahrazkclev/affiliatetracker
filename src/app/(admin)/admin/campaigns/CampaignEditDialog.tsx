'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Save, Loader2, CircleCheck, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { updateCampaign, deleteCampaign } from './campaign-actions';

type Campaign = {
    id: string;
    name: string;
    landing_url: string | null;
    default_commission_percent: number | null;
    is_default: boolean | null;
    cookie_days: number | null;
    require_approval: boolean | null;
    show_customer_email: boolean | null;
};

export function CampaignEditDialog({
    campaign,
    open,
    onOpenChange,
}: {
    campaign: Campaign;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const router = useRouter();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await updateCampaign(campaign.id, fd);
            if (result?.error) return;
            setSaved(true);
            router.refresh();
            setTimeout(() => {
                setSaved(false);
                onOpenChange(false);
            }, 1000);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl max-w-lg shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                <DialogHeader className="pb-4 border-b border-zinc-800">
                    <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-orange-400" />
                        </div>
                        Edit Campaign
                        <span className="text-sm font-normal text-zinc-400 ml-1">— {campaign.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Campaign Name</Label>
                        <Input
                            name="name"
                            defaultValue={campaign.name}
                            required
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Landing URL</Label>
                        <Input
                            name="landing_url"
                            type="text"
                            defaultValue={campaign.landing_url ?? ''}
                            placeholder="https://yoursite.com/landing"
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 font-mono text-sm placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Commission %</Label>
                            <div className="relative">
                                <Input
                                    name="default_commission_percent"
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={campaign.default_commission_percent ?? 30}
                                    className="bg-zinc-900 border-zinc-800 text-orange-400 font-bold focus-visible:ring-orange-500/50 pr-7"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Cookie Days</Label>
                            <div className="relative">
                                <Input
                                    name="cookie_days"
                                    type="number"
                                    min={1}
                                    defaultValue={campaign.cookie_days ?? 30}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 font-mono pr-10"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] uppercase font-bold tracking-widest">d</span>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Set as Default</p>
                            <p className="text-[11px] text-zinc-500 font-mono">Auto-assign new affiliates here</p>
                        </div>
                        <Switch name="is_default" defaultChecked={campaign.is_default ?? false} className="data-[state=checked]:bg-emerald-500" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Show Customer Email</p>
                            <p className="text-[11px] text-zinc-500 font-mono">Let portal affiliates see customer emails</p>
                        </div>
                        <Switch name="show_customer_email" defaultChecked={campaign.show_customer_email ?? false} className="data-[state=checked]:bg-orange-500" />
                    </div>
                    <div className="flex gap-2 pt-1">
                        {/* Delete button */}
                        {!confirmDelete ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirmDelete(true)}
                                className="flex-none border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300 bg-transparent h-10 px-3"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => {
                                    startDeleteTransition(async () => {
                                        await deleteCampaign(campaign.id);
                                        onOpenChange(false);
                                        router.refresh();
                                    });
                                }}
                                className="flex-none bg-red-600 hover:bg-red-500 text-white font-bold h-10 px-3 animate-pulse"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><AlertTriangle className="w-4 h-4 mr-1" /> Confirm</>  
                                )}
                            </Button>
                        )}

                        {/* Save button */}
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold h-10 shadow-[0_0_16px_rgba(234,88,12,0.25)]"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : saved ? (
                                <><CircleCheck className="w-4 h-4 mr-2" /> Saved!</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Campaign</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
