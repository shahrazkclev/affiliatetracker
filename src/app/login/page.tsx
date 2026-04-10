'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkLoginStatus, loginWithPassword, sendPasswordReset, sendOtpEmail } from "./actions";
import { AlertCircle, Loader2, Mail } from 'lucide-react';

type Step = 'email' | 'password' | 'otp-sent' | 'reset-sent';

export default function LoginPage() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isDashboard, setIsDashboard] = useState(false);

    useEffect(() => {
        const hostname = window.location.hostname;
        if (
            hostname.startsWith('dashboard.') ||
            hostname.startsWith('admin.') ||
            hostname === 'affiliatemango.com' ||
            hostname === 'www.affiliatemango.com' ||
            hostname === 'localhost'
        ) {
            setIsDashboard(true);
        }
    }, []);

    // ── Dashboard domain: existing email → password flow ────────────────────
    async function handleEmailCheck(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const typedEmail = (fd.get('email') as string).trim().toLowerCase();

        startTransition(async () => {
            if (!isDashboard) {
                // Portal domain — OTP only
                setEmail(typedEmail);
                const fd2 = new FormData();
                fd2.set('email', typedEmail);
                const result = await sendOtpEmail(fd2);
                if (result?.error) { setError(result.error); return; }
                setStep('otp-sent');
                return;
            }

            // Dashboard — password flow
            const result = await checkLoginStatus(fd);
            if (result.error) { setError(result.error); return; }
            if (result.notAffiliate) {
                setError('No account found with this email.');
                return;
            }
            setEmail(typedEmail);
            if (result.setupEmailSent) {
                setStep('otp-sent');
            } else if (result.hasPassword) {
                setStep('password');
            } else {
                const fd2 = new FormData();
                fd2.set('email', typedEmail);
                await sendPasswordReset(fd2);
                setStep('otp-sent');
            }
        });
    }

    async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set('email', email);
        startTransition(async () => {
            const result = await loginWithPassword(fd);
            if (result?.error) setError(result.error);
        });
    }

    async function handleForgotPassword() {
        setError(null);
        const fd = new FormData();
        fd.set('email', email);
        startTransition(async () => {
            const result = await sendPasswordReset(fd);
            if (result?.error) { setError(result.error); return; }
            setStep('reset-sent');
        });
    }

    const errorFromUrl = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('error')
        : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-3 pb-4">
                    <img
                        src="/affiliatemango_logo.png"
                        alt="AffiliateMango"
                        className="w-12 h-12 object-contain mx-auto"
                    />
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">
                            {step === 'email' ? 'Sign In' : step === 'password' ? 'Welcome back' : 'Check your inbox'}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            {step === 'email' && 'Enter your email to continue'}
                            {step === 'password' && email}
                            {step === 'otp-sent' && 'We sent you a sign-in link'}
                            {step === 'reset-sent' && 'Password reset link sent'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {(error || errorFromUrl) && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error || decodeURIComponent(errorFromUrl!)}</span>
                        </div>
                    )}

                    {/* ── Email step (universal) ─────────────────────────── */}
                    {step === 'email' && (
                        <form onSubmit={handleEmailCheck} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300 text-sm">Email Address</Label>
                                <Input id="email" name="email" type="email" placeholder="you@example.com"
                                    required autoFocus
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                            </div>
                            <Button type="submit" disabled={isPending}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold">
                                {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending link…</> : 'Continue'}
                            </Button>
                        </form>
                    )}

                    {/* ── Password step (dashboard only) ────────────────── */}
                    {step === 'password' && isDashboard && (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg text-sm text-zinc-400">
                                <span className="truncate flex-1">{email}</span>
                                <button type="button" onClick={() => { setStep('email'); setError(null); }}
                                    className="text-[11px] text-orange-400 hover:underline shrink-0">Change</button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
                                <Input id="password" name="password" type="password" required autoFocus
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 focus-visible:ring-orange-500/50" />
                            </div>
                            <Button type="submit" disabled={isPending}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold">
                                {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : 'Sign In'}
                            </Button>
                            <button type="button" onClick={handleForgotPassword} disabled={isPending}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1">
                                Forgot password?
                            </button>
                        </form>
                    )}

                    {/* ── OTP sent / setup email sent ───────────────────── */}
                    {(step === 'otp-sent' || step === 'reset-sent') && (
                        <div className="text-center space-y-4 py-2">
                            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                <Mail className="w-7 h-7 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-zinc-200 font-medium">
                                    {step === 'otp-sent' ? 'Sign-in link sent' : 'Password reset link sent'}
                                </p>
                                <p className="text-orange-400 font-mono text-sm mt-1">{email}</p>
                            </div>
                            <p className="text-zinc-500 text-sm">
                                {step === 'otp-sent'
                                    ? 'Click the link in your email to sign in. Check your spam folder if you don\'t see it.'
                                    : 'Click the link in your email to set a new password.'}
                            </p>
                            <button type="button" onClick={() => { setStep('email'); setError(null); }}
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                ← Use a different email
                            </button>
                        </div>
                    )}
                </CardContent>

                {!isDashboard && (
                    <div className="mt-6 pb-6 text-center text-sm">
                        <span className="text-zinc-500">Don't have an account? </span>
                        <a href="/" className="text-orange-400 font-medium hover:underline">Apply as Affiliate</a>
                    </div>
                )}
            </Card>
        </div>
    );
}
