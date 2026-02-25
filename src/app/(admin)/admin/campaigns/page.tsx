import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, Activity, BarChart3, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function CampaignSettingsPage() {
    const supabase = await createClient();

    // Fetch the default campaign
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_default', true)
        .single();

    return (
        <div className="space-y-4 max-w-7xl mx-auto font-sans">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Megaphone className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Campaign Settings</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-zinc-400 font-medium tracking-wide">Global commission variables</p>
                        <span className="text-[10px] uppercase font-mono bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">Config Mode</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-orange-400 cursor-pointer mb-2 w-max transition-colors group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span className="uppercase tracking-wider">Return to Campaign List</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                        <CardHeader className="pb-4 border-b border-zinc-800/50">
                            <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                {campaign?.name || 'Campaign Name'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Identity Tag</Label>
                                <Input defaultValue={campaign?.name || ''} className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 shadow-inner font-mono text-sm" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tracking Protocol</Label>
                                <Select defaultValue="affiliate-links">
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 shadow-inner focus:ring-orange-500/50">
                                        <SelectValue placeholder="Select tracking protocol" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        <SelectItem value="affiliate-links">Direct Links (URL Params)</SelectItem>
                                        <SelectItem value="promo-codes">Checkout Promo Codes</SelectItem>
                                        <SelectItem value="both">Hybrid Mode (Both)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                                    Defines how the routing engine attributes external traffic to your affiliates.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Base Gateway URL</Label>
                                <Input defaultValue="https://cleverpoly.store/lml" className="bg-zinc-950 border-zinc-800 text-zinc-300 focus-visible:ring-orange-500/50 shadow-inner font-mono text-sm" />
                                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                                    Root URL for generated affiliate links. <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors uppercase hover:underline">Read Router Docs ↗</a>
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Yield Variable Type</Label>
                                <div className="flex flex-col gap-3 bg-zinc-950/50 p-4 border border-zinc-800/80 rounded-lg">
                                    <div className="flex items-center gap-3 cursor-pointer group">
                                        <div className="w-4 h-4 rounded-full border-4 border-orange-500 bg-zinc-900 shadow-[0_0_8px_rgba(217,70,239,0.3)] transition-all"></div>
                                        <span className="text-sm text-zinc-200 font-medium group-hover:text-white transition-colors">Percentage Yield</span>
                                    </div>
                                    <div className="flex items-center gap-3 cursor-pointer group">
                                        <div className="w-4 h-4 rounded-full border-2 border-zinc-700 bg-zinc-950 group-hover:border-zinc-500 transition-all"></div>
                                        <span className="text-sm text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors">Static Value (Flat)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Yield Coefficient (%)</Label>
                                <div className="relative w-32">
                                    <Input defaultValue={campaign?.default_commission_percent || 30} className="bg-zinc-950 border-zinc-800 text-orange-400 font-bold text-lg focus-visible:ring-orange-500/50 shadow-inner pr-8" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <Settings className="w-4 h-4 text-zinc-500" /> Advanced Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">

                            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg group-hover:border-orange-500/20 transition-colors">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 mb-1">Affiliate Approval</h4>
                                    <p className="text-xs text-zinc-500 font-mono">Require manual admin verification before activating new affiliates</p>
                                </div>
                                <Switch checked={true} className="data-[state=checked]:bg-orange-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
                            </div>

                            <div className="space-y-2 text-zinc-300">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Session TTL (Cookie)</Label>
                                <div className="relative w-32 border-l-2 border-zinc-700 pl-3 focus-within:border-orange-500 transition-colors">
                                    <Input defaultValue="5" className="w-20 bg-zinc-950 border-zinc-800 text-zinc-300 focus-visible:ring-orange-500/50 font-mono shadow-inner pr-2" />
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] uppercase font-bold tracking-widest pl-1">Days</span>
                                </div>
                                <p className="text-[11px] font-mono text-zinc-500 mt-2">Cache duration for incoming traffic on local machines.</p>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute -right-16 -top-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800/50">
                            <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 flex-1">
                                <Activity className="w-3.5 h-3.5 text-amber-500" /> Output Value
                            </CardTitle>
                            <Select defaultValue="12m">
                                <SelectTrigger className="w-[125px] h-7 text-[10px] bg-zinc-950 border-zinc-800 text-zinc-400 focus:ring-amber-500/50">
                                    <SelectValue placeholder="Last 12 months" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
                                    <SelectItem value="12m">Trailing 12m</SelectItem>
                                    <SelectItem value="6m">Trailing 6m</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-zinc-100 font-mono mb-4 tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">$6,661.22</div>
                            <div className="h-28 w-full flex items-end relative border-b border-zinc-800/50">
                                <svg className="absolute inset-0 h-full w-full opacity-70 group-hover:opacity-100 transition-opacity duration-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M0,40 L15,45 L30,25 L45,40 L60,80 L75,50 L90,55 L100,90" fill="none" stroke="#fbbf24" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                    <path d="M0,40 L15,45 L30,25 L45,40 L60,80 L75,50 L90,55 L100,90 L100,100 L0,100 Z" fill="url(#spark-green)" opacity="0.15"></path>
                                    <defs>
                                        <linearGradient id="spark-green" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#fbbf24" />
                                            <stop offset="100%" stopColor="transparent" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800/50">
                            <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 flex-1">
                                <BarChart3 className="w-3.5 h-3.5 text-orange-500" /> Yield Distributed
                            </CardTitle>
                            <Select defaultValue="12m">
                                <SelectTrigger className="w-[125px] h-7 text-[10px] bg-zinc-950 border-zinc-800 text-zinc-400 focus:ring-orange-500/50">
                                    <SelectValue placeholder="Last 12 months" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
                                    <SelectItem value="12m">Trailing 12m</SelectItem>
                                    <SelectItem value="6m">Trailing 6m</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-zinc-100 font-mono mb-4 tracking-tight drop-shadow-[0_0_8px_rgba(217,70,239,0.3)]">$1,998.39</div>
                            <div className="h-28 w-full flex items-end relative border-b border-zinc-800/50">
                                <svg className="absolute inset-0 h-full w-full opacity-70 group-hover:opacity-100 transition-opacity duration-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M0,70 L15,75 L30,55 L45,65 L60,95 L75,65 L90,75 L100,90" fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                    <path d="M0,70 L15,75 L30,55 L45,65 L60,95 L75,65 L90,75 L100,90 L100,100 L0,100 Z" fill="url(#spark-ping)" opacity="0.15"></path>
                                    <defs>
                                        <linearGradient id="spark-ping" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#f97316" />
                                            <stop offset="100%" stopColor="transparent" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
