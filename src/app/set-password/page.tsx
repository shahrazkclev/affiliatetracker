'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword } from "@/app/login/actions";
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await setPassword(fd);
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
                        <CardTitle className="text-2xl font-bold text-zinc-100">Create a Password</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            Set a password to secure your account for future logins
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300 text-sm">New Password</Label>
                            <Input id="password" name="password" type="password" required autoFocus
                                minLength={8} placeholder="At least 8 characters"
                                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required
                                className="bg-zinc-950 border-zinc-700 text-zinc-100 focus-visible:ring-orange-500/50" />
                        </div>
                        <Button type="submit" disabled={isPending}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold disabled:opacity-60">
                            {isPending
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Setting password…</>
                                : 'Set Password & Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
