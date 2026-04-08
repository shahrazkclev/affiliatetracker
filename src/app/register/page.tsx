'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerPlatformOwner } from "./actions";
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const result = await registerPlatformOwner(fd);
            if (result?.error) setError(result.error);
        });
    }

    return (
        <div className="min-h-screen flex bg-[#0e0e10] text-zinc-100 font-sans">
            {/* Left Panel: Context & Value Props (Hidden on mobile) */}
            <div className="hidden lg:flex w-[45%] bg-[#0a0a0a] border-r border-zinc-800 flex-col px-12 py-16 justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,88,12,0.15)_0%,transparent_50%)] pointer-events-none" />
                
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-16 group">
                        <img 
                            src="/affiliatemango_logo.png" 
                            alt="AffiliateMango Logo" 
                            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform"
                        />
                        <span className="font-extrabold text-2xl tracking-tighter">Affiliate<span className="text-orange-500">Mango</span></span>
                    </Link>

                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-6">
                        Launch your affiliate program in minutes.
                    </h1>
                    <p className="text-zinc-400 text-lg mb-12">
                        Get everything you need to create, manage, and scale a world-class partner network perfectly integrated with Stripe.
                    </p>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Create Workspace</h3>
                                <p className="text-zinc-500 text-sm">Secure your custom tenant portal and invite your team.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Configure & Integrate</h3>
                                <p className="text-zinc-500 text-sm">Design your portal and drop the tracking snippet into your app.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Select Subscription</h3>
                                <p className="text-zinc-500 text-sm">Capture your billing details inside the dashboard to activate your trial.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mt-12 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-zinc-200">No credit card required upfront</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        You'll only need to enter payment details once you're inside your workspace and ready to start your 14-day free trial. Explore the platform risk-free today.
                    </p>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 xl:px-32 relative">
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile logo header */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/affiliatemango_logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </Link>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Create your account</h2>
                        <p className="text-zinc-400">Let's get your affiliate network deployed.</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 shadow-sm">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-zinc-300 font-semibold">Workspace / Company Name</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="e.g. Acme Corp"
                                required
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300 font-semibold">Work Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="founder@acmecorp.com"
                                required
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-12 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 font-semibold">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-zinc-300 font-semibold">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                disabled={isPending}
                                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all flex items-center justify-center gap-2 text-[15px]"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Continue'}
                            </Button>
                            
                            <p className="text-center text-xs text-zinc-500 mt-4 leading-relaxed lg:hidden">
                                No credit card required. You'll set up your subscription inside your workspace.
                            </p>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-zinc-800/50 text-center text-zinc-400">
                        Already have a workspace?{' '}
                        <Link href="/login" className="text-white hover:text-orange-400 font-semibold transition-colors underline decoration-zinc-700 underline-offset-4 hover:decoration-orange-400/50">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
