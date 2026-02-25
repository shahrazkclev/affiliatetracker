import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon, PaintBucket, Type, Save, Settings as SettingsIcon } from "lucide-react";

export default function GlobalSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <SettingsIcon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">System Configuration</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-orange-500/50 pl-2 ml-1 mt-1">Global parameters & portal rendering</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                    <CardHeader className="pb-4 border-b border-zinc-800/50">
                        <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <PaintBucket className="w-4 h-4 text-orange-400" /> Portal Interface Styling
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                            Customize the visual output of the affiliate registration gateway
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Brand Logo Asset</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center shadow-inner group-hover:border-orange-500/30 transition-colors">
                                    <span className="text-zinc-700 font-bold text-xl font-mono">C</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="outline" className="h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-orange-500/50 font-mono text-xs shadow-inner transition-all w-max">
                                        <ImageIcon className="w-3.5 h-3.5 mr-2" />
                                        Upload Image
                                    </Button>
                                    <span className="text-[10px] uppercase font-mono text-zinc-500">Suggested: 256x256 PNG/SVG</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Primary Accent Hex</Label>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-zinc-700 shadow-inner bg-[#E2E8F0]"></div>
                                <Input defaultValue="#E2E8F0" className="w-32 font-mono text-xs bg-zinc-950 border-zinc-800 text-zinc-300 focus-visible:ring-orange-500/50 shadow-inner" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Typography Output</Label>
                            <div className="flex gap-3">
                                <div className="flex-1 border border-orange-500 bg-orange-500/5 rounded-lg p-3 text-center cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500/20 blur-xl" />
                                    <div className="font-sans font-medium text-zinc-200">System Sans</div>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest text-orange-400">Active</div>
                                </div>
                                <div className="flex-1 border border-zinc-800 bg-zinc-950 rounded-lg p-3 text-center cursor-pointer hover:border-zinc-700 transition-colors">
                                    <div className="font-serif font-medium text-zinc-400">Times System</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-widest">Select</div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
                    <CardHeader className="pb-4 border-b border-zinc-800/50">
                        <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4 text-orange-400" /> Legal Compliance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Terms of Service URL (Optional)</Label>
                            <Input placeholder="https://..." className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500/50 shadow-inner font-mono text-sm" />
                            <p className="text-[11px] font-mono text-zinc-500 mt-1">If provided, nodes must agree to this contract before mounting to the network.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                    <Button className="bg-orange-600 hover:bg-orange-500 text-zinc-50 font-bold tracking-wide shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-95 transition-all w-full sm:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        Commit Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
