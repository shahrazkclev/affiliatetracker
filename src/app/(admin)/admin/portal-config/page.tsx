"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorPlay, Globe, Palette, Upload, CheckCircle2, Copy, RefreshCw } from "lucide-react";

export default function PortalConfigPage() {
    const [domain, setDomain] = useState("");
    const defaultDomain = "affiliates.cleverpoly.store";

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <MonitorPlay className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Portal Configuration</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-amber-500/50 pl-2 ml-1 mt-1">Manage affiliate dashboard styling & domains</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Domain Settings */}
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden group">
                        <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-600" />
                        <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <Globe className="w-4 h-4 text-amber-500" /> Custom Domain
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">Current Gateway</Label>
                                <div className="flex items-center justify-between">
                                    <span className="text-amber-500 font-mono text-sm">https://{domain || defaultDomain}</span>
                                    <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-amber-500">
                                        <Copy className="w-3.5 h-3.5 mr-2" /> Copy
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Connect Custom Domain</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="partners.yourbrand.com"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-amber-500 font-mono"
                                    />
                                    <Button className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        Verify DNS
                                    </Button>
                                </div>
                                <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">DNS Configuration</h4>
                                    <p className="text-[11px] text-zinc-500 font-mono">
                                        Add the following record to your domain's DNS settings. It may take up to 24 hours to propagate globally.
                                    </p>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                                        <table className="w-full text-left text-[11px] font-mono">
                                            <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-3 py-2">Type</th>
                                                    <th className="px-3 py-2">Name</th>
                                                    <th className="px-3 py-2">Value / Target</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-zinc-300">
                                                <tr>
                                                    <td className="px-3 py-2 text-amber-500 font-bold">CNAME</td>
                                                    <td className="px-3 py-2">{domain ? domain.split('.')[0] : 'partners'}</td>
                                                    <td className="px-3 py-2 font-bold tracking-tight">cname.cleverpoly.store</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Styling Settings */}
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4 text-amber-500" /> Branding & Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Brand Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-zinc-100 to-zinc-500">CP</span>
                                    </div>
                                    <Button variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-xs">
                                        <Upload className="w-3.5 h-3.5 mr-2" /> Upload Image
                                    </Button>
                                </div>
                            </div>

                            <div className="h-px bg-zinc-800/50 w-full" />

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Primary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] border border-amber-400/50"></div>
                                        <Input defaultValue="#f59e0b" className="w-24 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs focus-visible:ring-amber-500 h-8" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dashboard Theme</Label>
                                    <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-md p-1">
                                        <div className="flex-1 text-center text-xs py-1.5 rounded bg-zinc-800 text-zinc-100 font-medium cursor-pointer">Dark Nodes</div>
                                        <div className="flex-1 text-center text-xs py-1.5 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">Clean Tech</div>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Preview / Helper */}
                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden relative group/preview">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Preview Status</CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-amber-500 hover:bg-zinc-800">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SSL Certificate Active
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> DNS Verified
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Global Edge CDN Routing
                            </div>

                            <Button className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-inner">
                                Open Portal Preview
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
