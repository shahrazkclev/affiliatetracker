'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, CircleCheck, Megaphone } from 'lucide-react';
import { createCampaign } from './campaign-actions';

export function AddCampaignDialog() {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await createCampaign(fd);
            if (result.error) {
                setError(result.error);
            } else {
                setSaved(true);
                setTimeout(() => {
                    setOpen(false);
                    setSaved(false);
                    router.refresh();
                }, 1000);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-500 text-black font-bold shadow-[0_0_16px_rgba(234,88,12,0.25)] gap-2">
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl max-w-md shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                <DialogHeader className="pb-4 border-b border-zinc-800">
                    <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Megaphone className="w-4 h-4 text-orange-400" />
                        </div>
                        Create Campaign
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Campaign Name</Label>
                        <Input
                            name="name"
                            placeholder="e.g. Summer Affiliates"
                            required
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 font-mono text-sm placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Landing URL</Label>
                        <Input
                            name="landing_url"
                            type="url"
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
                                    defaultValue={30}
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
                                    defaultValue={30}
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
                        <Switch name="is_default" className="data-[state=checked]:bg-emerald-500" />
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold h-10 shadow-[0_0_16px_rgba(234,88,12,0.25)]"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                        ) : saved ? (
                            <><CircleCheck className="w-4 h-4 mr-2" /> Created!</>
                        ) : (
                            <><Plus className="w-4 h-4 mr-2" /> Create Campaign</>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
