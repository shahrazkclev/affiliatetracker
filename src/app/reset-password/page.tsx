'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword } from "@/app/login/actions";
import { AlertCircle, Loader2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('return_to'); // e.g. "affiliates.cleverpoly.store"
    const portalUrl = returnTo ? `https://${returnTo}` : '/portal';
    const portalHost = returnTo ?? 'your portal';

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
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4">
            <Card className="w-full max-w-sm bg-white border-gray-200 shadow-md">
                <CardHeader className="text-center space-y-3 pb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-200">
                        C
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            {done ? 'Password Updated' : 'Set a New Password'}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                            {done
                                ? `Your password is ready. Return to ${portalHost} to sign in.`
                                : 'Choose a strong password for your account'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {done ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl mx-auto flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7 text-green-500" />
                            </div>
                            <p className="text-gray-500 text-sm">
                                Your password has been updated successfully.
                            </p>
                            <a
                                href={`${portalUrl}/login`}
                                className="inline-flex items-center justify-center gap-2 w-full text-center bg-orange-500 hover:bg-orange-600 text-white h-11 px-4 rounded-md font-semibold transition-colors text-sm"
                            >
                                Continue to {portalHost}
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            {returnTo && (
                                <p className="text-xs text-gray-400">
                                    You'll be taken to <span className="font-mono">{returnTo}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-lg text-sm mb-4">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 text-sm">New Password</Label>
                                    <Input id="password" name="password" type="password" required autoFocus
                                        minLength={8} placeholder="At least 8 characters"
                                        className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-orange-400" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-700 text-sm">Confirm Password</Label>
                                    <Input id="confirmPassword" name="confirmPassword" type="password" required
                                        className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-orange-400" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    Minimum 8 characters
                                </div>
                                <Button type="submit" disabled={isPending}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 font-semibold disabled:opacity-60">
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
            <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
