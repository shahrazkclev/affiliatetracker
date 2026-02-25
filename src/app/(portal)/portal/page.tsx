"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link as LinkIcon, Activity, MousePointerClick, Users, DollarSign, Network, Wallet } from "lucide-react";

export default function PortalHome() {
    const affiliateCode = "test";
    const [subId, setSubId] = useState("");

    const baseUrl = `https://cleverpoly.store/pricing?via=${affiliateCode}`;
    const generatedUrl = subId ? `${baseUrl}&subId=${subId}` : baseUrl;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl);
        // Toast notification could go here
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Network className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Network Dashboard</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-orange-500/50 pl-2 ml-1 mt-1">Real-time terminal statistics</p>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                    <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-orange-400" /> Deep Link Generator
                    </CardTitle>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">Create granular tracking links for specific traffic sources (e.g. instareel)</p>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tracking Sub-ID (Optional)</label>
                            <Input
                                placeholder="e.g. tiktok_bio, instareel"
                                value={subId}
                                onChange={(e) => setSubId(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 fill-zinc-900 shadow-inner font-mono text-sm"
                            />
                        </div>
                        <div className="flex-[2] space-y-1.5 w-full">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your Unique URL</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 flex items-center text-orange-400 font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
                                    {generatedUrl}
                                </div>
                                <Button onClick={copyToClipboard} className="bg-orange-600 hover:bg-orange-500 text-black font-semibold shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] active:scale-95 transition-all">
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Commission", value: "$0.00", icon: DollarSign, color: "text-amber-400", shadow: "shadow-[0_0_10px_rgba(251,191,36,0.3)]" },
                    { title: "Unpaid Commission", value: "$0.00", icon: Wallet, color: "text-zinc-100" },
                    { title: "Network Clicks", value: "0", icon: MousePointerClick, color: "text-zinc-100" },
                    { title: "Paying Referrals", value: "0", icon: Users, color: "text-zinc-100" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-zinc-800/50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-4 relative">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{stat.title}</h4>
                                <stat.icon className={`w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors`} />
                            </div>
                            <div className={`text-3xl font-bold font-mono tracking-tight ${stat.color} ${stat.shadow || ''}`}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { title: "Revenue Generated", value: "$0.00" },
                    { title: "Commission Earned", value: "$0.00" }
                ].map((chart, i) => (
                    <Card key={i} className="bg-zinc-900 border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-colors duration-300 relative overflow-hidden h-72">
                        <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${i === 0 ? 'bg-amber-500' : 'bg-orange-500'}`} />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800/50 z-10 relative bg-zinc-900/50">
                            <div>
                                <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity className={`w-3.5 h-3.5 ${i === 0 ? 'text-amber-500' : 'text-orange-500'}`} /> {chart.title}
                                </CardTitle>
                                <div className="text-2xl font-bold text-zinc-100 font-mono mt-1 tracking-tight">{chart.value}</div>
                            </div>
                            <select className="h-7 text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-400 rounded focus:ring-1 focus:ring-orange-500/50 px-2 uppercase tracking-wider font-mono">
                                <option>Last 12 months</option>
                            </select>
                        </CardHeader>
                        <CardContent className="pt-4 relative h-full">
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="h-px bg-zinc-800/50 w-full mb-6"></div>
                                <div className="h-px bg-zinc-800/50 w-full mb-6"></div>
                                <div className={`h-[2px] w-full relative z-10 ${i === 0 ? 'bg-amber-500' : 'bg-orange-500'} shadow-[0_0_8px_rgba(249,115,22,0.5)]`}></div>
                                <div className="flex justify-between mt-3 text-[10px] text-zinc-500 font-mono tracking-wider">
                                    <span>Apr</span>
                                    <span>Jun</span>
                                    <span>Aug</span>
                                    <span>Oct</span>
                                    <span>Dec</span>
                                    <span>Feb</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
