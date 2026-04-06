'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, BarChart3, Settings, Save, Loader2, CircleCheck } from "lucide-react";
import { updateCampaign } from "./campaign-actions";

type Campaign = {
    id: string;
    name: string;
    landing_url: string | null;
    default_commission_percent: number | null;
    is_default: boolean | null;
    cookie_days: number | null;
    require_approval: boolean | null;
};

export function CampaignEditCard({ campaign }: { campaign: Campaign }) {
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            await updateCampaign(campaign.id, fd);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                        <CardHeader className="pb-4 border-b border-zinc-800/50">
                            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                                {campaign.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Campaign Name</Label>
                                <Input name="name" defaultValue={campaign.name} className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 shadow-inner font-mono text-sm" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Landing URL</Label>
                                <Input
                                    name="landing_url"
                                    type="text"
                                    defaultValue={campaign.landing_url ?? ''}
                                    placeholder="https://yoursite.com/landing-page"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 shadow-inner font-mono text-sm placeholder:text-zinc-600"
                                />
                                <p className="text-[11px] text-zinc-600 font-mono">The page affiliates will link to. Their ref code is appended automatically.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tracking Protocol</Label>
                                <Select name="tracking_protocol" defaultValue="affiliate-links">
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 shadow-inner focus:ring-orange-500/50">
                                        <SelectValue placeholder="Select tracking protocol" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        <SelectItem value="affiliate-links">Direct Links (URL Params)</SelectItem>
                                        <SelectItem value="promo-codes">Checkout Promo Codes</SelectItem>
                                        <SelectItem value="both">Hybrid Mode (Both)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Commission (%)</Label>
                                <div className="relative w-32">
                                    <Input
                                        name="default_commission_percent"
                                        type="number"
                                        min={0}
                                        max={100}
                                        defaultValue={campaign.default_commission_percent ?? 30}
                                        className="bg-zinc-950 border-zinc-800 text-orange-400 font-bold text-lg focus-visible:ring-orange-500/50 shadow-inner pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cookie Duration (days)</Label>
                                <div className="relative w-32">
                                    <Input
                                        name="cookie_days"
                                        type="number"
                                        min={1}
                                        defaultValue={campaign.cookie_days ?? 30}
                                        className="bg-zinc-950 border-zinc-800 text-zinc-300 focus-visible:ring-orange-500/50 font-mono shadow-inner pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] uppercase font-bold tracking-widest">days</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl">
                        <CardHeader className="pb-4 border-b border-zinc-800/50">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <Settings className="w-4 h-4 text-zinc-500" /> Advanced Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 mb-1">Affiliate Approval</h4>
                                    <p className="text-xs text-zinc-500 font-mono">Require manual admin verification before activating new affiliates</p>
                                </div>
                                <Switch name="require_approval" defaultChecked={campaign.require_approval ?? true} className="data-[state=checked]:bg-orange-500" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 mb-1">Default Campaign</h4>
                                    <p className="text-xs text-zinc-500 font-mono">New affiliates are assigned to this campaign automatically</p>
                                </div>
                                <Switch name="is_default" defaultChecked={campaign.is_default ?? false} className="data-[state=checked]:bg-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold h-11 text-sm shadow-[0_0_20px_rgba(234,88,12,0.3)]"
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

                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors relative overflow-hidden">
                        <div className="absolute -right-16 -top-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800/50">
                            <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-amber-500" /> Output Value
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-zinc-100 font-mono mb-4 tracking-tight">Calculating…</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors relative overflow-hidden">
                        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800/50">
                            <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5 text-orange-500" /> Yield Distributed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-zinc-100 font-mono mb-4 tracking-tight">Calculating…</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
