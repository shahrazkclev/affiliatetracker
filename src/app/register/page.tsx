'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerPlatformOwner } from "./actions";
import { AlertCircle, Loader2 } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-3 pb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
                        C
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">Create Workspace</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">Deploy your affiliate network</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4 relative">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-zinc-300">Company Name</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="Acme Corp"
                                required
                                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Work Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="founder@acmecorp.com"
                                required
                                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 h-11"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isPending}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold h-11 shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)] transition-all"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Network'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-zinc-400 text-sm">
                        Already have a workspace? <Link href="/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">Sign in</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
