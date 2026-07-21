'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword, verifyOtpCode } from "@/app/login/actions";
import { AlertCircle, Loader2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const returnTo = searchParams.get('return_to');
    const portalUrl = returnTo ? `https://${returnTo}` : '/portal';
    const portalHost = returnTo ?? 'your portal';

    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [verifyingToken, setVerifyingToken] = useState(!!(token && email));
    const [isPending, startTransition] = useTransition();

    // Auto-verify token on mount if present in URL
    useEffect(() => {
        if (token && email) {
            startTransition(async () => {
                const fd = new FormData();
                fd.set('email', email);
                fd.set('code', token);
                const res = await verifyOtpCode(fd);
                if (res?.error) {
                    setError('Reset link is invalid or expired. Please request a new one.');
                }
                setVerifyingToken(false);
            });
        }
    }, [token, email]);

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
            if (result?.error) {
                setError(result.error);
                return;
            }
            setDone(true);
        });
    }

    if (verifyingToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e0e10] p-4 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-sm text-zinc-400 font-medium">Verifying reset token…</p>
            </div>
        );
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
                            {done
                                ? `Your password is ready. Return to ${portalHost} to sign in.`
                                : 'Choose a strong password for your account'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {done ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl mx-auto flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7 text-green-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Your password has been updated successfully.
                            </p>
                            <a
                                href={`${portalUrl}/login`}
                                className="inline-flex items-center justify-center gap-2 w-full text-center bg-orange-600 hover:bg-orange-500 text-white h-11 px-4 rounded-md font-semibold transition-colors text-sm"
                            >
                                Continue to {portalHost}
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            {returnTo && (
                                <p className="text-xs text-zinc-500">
                                    You'll be taken to <span className="font-mono text-zinc-400">{returnTo}</span>
                                </p>
                            )}
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
                                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-800">
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
