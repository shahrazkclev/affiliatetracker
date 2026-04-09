'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { updatePortalConfigWizard } from './actions';

export default function RegisterConfigurePage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleConfigure(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const result = await updatePortalConfigWizard(fd);
            if (result?.error) setError(result.error);
        });
    }

    return (
        <div className="min-h-screen flex bg-[#0e0e10] text-zinc-100 font-sans">
            {/* Left Panel */}
            <div className="hidden lg:flex w-[45%] bg-[#0a0a0a] border-r border-zinc-800 flex-col px-12 py-16 justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,88,12,0.15)_0%,transparent_50%)] pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-16 group">
                        <img 
                            src="/affiliatemango_logo.png" 
                            alt="AffiliateMango Logo" 
                            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform"
                        />
                        <span className="font-extrabold text-2xl tracking-tighter">Affiliate<span className="text-orange-500">Mango</span></span>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-6">
                        Make it truly yours.
                    </h1>
                    <p className="text-zinc-400 text-lg mb-12">
                        Customize your partner portal with your brand colors and styles so your affiliates feel right at home.
                    </p>

                    <div className="space-y-8">
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1 text-emerald-500">Create Workspace</h3>
                                <p className="text-zinc-500 text-sm">Workspace successfully provisioned.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Configure & Integrate</h3>
                                <p className="text-zinc-400 text-sm">Design your portal and map your domains.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-40">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Select Subscription</h3>
                                <p className="text-zinc-500 text-sm">Capture your billing details inside the dashboard to activate your trial.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 xl:px-32 relative">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Portal Configuration</h2>
                        <p className="text-zinc-400">Set up your brand identity. You can change these later.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 shadow-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleConfigure} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="brandColor" className="text-zinc-300 font-semibold">Brand Hex Color</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="brandColor"
                                    name="brandColor"
                                    type="color"
                                    defaultValue="#ea580c"
                                    required
                                    className="w-14 h-12 p-1 rounded-xl bg-zinc-900 border-zinc-800 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    defaultValue="#ea580c"
                                    placeholder="#HEXVAL"
                                    className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100 h-12 rounded-xl focus-visible:ring-orange-500 uppercase font-mono"
                                    onChange={(e) => {
                                        const colorPicker = document.getElementById('brandColor') as HTMLInputElement;
                                        if (colorPicker && e.target.value.match(/^#[0-9a-fA-F]{6}$/)) {
                                            colorPicker.value = e.target.value;
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-zinc-500">This color will be used for buttons and accents throughout your portal.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUrl" className="text-zinc-300 font-semibold">Logo URL (Optional)</Label>
                            <Input
                                id="logoUrl"
                                name="logoUrl"
                                type="url"
                                placeholder="https://example.com/logo.png"
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500 h-12 rounded-xl"
                            />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button 
                                type="submit" 
                                disabled={isPending}
                                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
                                {!isPending && <ChevronRight className="w-4 h-4" />}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
