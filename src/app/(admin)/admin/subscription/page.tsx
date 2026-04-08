"use client";

import { CreditCard, Rocket, Check, Zap } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function SubscriptionPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        setIsLoading(true);
        // Stripe integration checkout logic goes here
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-12">
            {/* Header section with Mango Motif */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-950 p-8 shadow-2xl">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                            <Zap className="w-3 h-3" />
                            Premium Features
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            Upgrade your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Workspace</span>
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Get access to unlimited campaigns, advanced analytics, custom webhook behaviors, and VIP support for your affiliate network.
                        </p>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                        <Image 
                            src="/affiliatemango_logo.png" 
                            alt="Brand Motif" 
                            width={160} 
                            height={160} 
                            className="relative z-10 scale-[1.2] drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>

            {/* Current Plan Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 border border-zinc-800 rounded-2xl p-6 bg-zinc-900/40 relative overflow-hidden">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Current Plan</h3>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-zinc-800 rounded-full text-zinc-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">Free Trial</div>
                            <div className="text-sm text-zinc-400">Active until cancelled</div>
                        </div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-sm text-zinc-300">
                            <Check className="w-4 h-4 text-emerald-500" />
                            Up to 100 Active Affiliates
                        </li>
                        <li className="flex items-center gap-3 text-sm text-zinc-300">
                            <Check className="w-4 h-4 text-emerald-500" />
                            Standard Email Templates
                        </li>
                        <li className="flex items-center gap-3 text-sm text-zinc-300">
                            <Check className="w-4 h-4 text-emerald-500" />
                            Basic Payout Engine
                        </li>
                    </ul>

                    <div className="w-full h-[1px] bg-zinc-800 mb-6" />
                    <p className="text-xs text-zinc-500 text-center">
                        You are currently on the trial tier. Upgrade to unlock the full potential of your platform.
                    </p>
                </div>

                {/* Upgrade Call to Action Card */}
                <div className="lg:col-span-2 border border-amber-500/30 rounded-2xl p-8 bg-gradient-to-br from-zinc-900/80 to-zinc-950 relative overflow-hidden backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.05)]">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Rocket className="w-6 h-6 text-amber-500" />
                                AffiliateMango Pro
                            </h2>
                            <p className="text-zinc-400 max-w-md">
                                Empower your referral business with robust automation, complete white-label logic, priority support, and multi-currency payout batching.
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="text-4xl font-bold text-white">$49<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl w-full md:w-[280px]">
                            <h4 className="text-sm font-medium text-white mb-4">Pro Perks:</h4>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2 text-sm text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    Unlimited Affiliates
                                </li>
                                <li className="flex items-start gap-2 text-sm text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    Custom Portal Domains
                                </li>
                                <li className="flex items-start gap-2 text-sm text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    No transaction fees
                                </li>
                                <li className="flex items-start gap-2 text-sm text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    API & Webhook Access
                                </li>
                            </ul>
                            
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    "Upgrade via Stripe"
                                )}
                            </button>
                            <p className="text-[10px] text-zinc-500 text-center mt-3">Powered securely by Stripe</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
