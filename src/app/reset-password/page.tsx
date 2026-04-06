'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword } from "@/app/login/actions";
import { AlertCircle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        if (fd.get('password') !== fd.get('confirmPassword')) {
            setError('Passwords do not match.');
            return;
        }
        startTransition(async () => {
            const result = await setPassword(fd);
            if (result?.error) { setError(result.error); return; }
            setDone(true);
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
                        <CardTitle className="text-2xl font-bold text-zinc-100">
                            {done ? 'Password Updated' : 'Set a New Password'}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            {done ? 'You can now sign in with your new password' : 'Choose a strong password for your account'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {done ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7 text-green-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">Your password has been updated successfully.</p>
                            <a href="/portal"
                                className="inline-block w-full text-center bg-orange-600 hover:bg-orange-500 text-white h-11 leading-[44px] rounded-md font-semibold transition-colors text-sm">
                                Go to Portal
                            </a>
                        </div>
                    ) : (
                        <>
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
                                <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-800/50 rounded-lg px-3 py-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                    Minimum 8 characters
                                </div>
                                <Button type="submit" disabled={isPending}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold disabled:opacity-60">
                                    {isPending
                                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating…</>
                                        : 'Update Password'}
                                </Button>
                            </form>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
