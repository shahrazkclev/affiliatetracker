'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkLoginStatus, loginWithPassword, sendPasswordReset } from "./actions";
import { AlertCircle, Loader2, Mail } from 'lucide-react';

type Step = 'email' | 'password' | 'setup-sent' | 'reset-sent';

export default function LoginPage() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isDashboard, setIsDashboard] = useState(false);

    useEffect(() => {
        const hostname = window.location.hostname;
        if (hostname.startsWith('dashboard.') || hostname.startsWith('admin.') || hostname === 'affiliatemango.com' || hostname === 'www.affiliatemango.com') {
            setIsDashboard(true);
        }
    }, []);

    async function handleEmailCheck(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const typedEmail = (fd.get('email') as string).trim().toLowerCase();

        startTransition(async () => {
            const result = await checkLoginStatus(fd);

            if (result.error) { setError(result.error); return; }
            if (result.notAffiliate) {
                setError('No affiliate account found with this email. Please apply first.');
                return;
            }

            setEmail(typedEmail);

            if (result.setupEmailSent) {
                // First time — we just created their account and sent a setup email
                setStep('setup-sent');
            } else if (result.hasPassword) {
                setStep('password');
            } else {
                // Has account but no password — send reset email
                const fd2 = new FormData();
                fd2.set('email', typedEmail);
                await sendPasswordReset(fd2);
                setStep('setup-sent');
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

    const subtitle: Record<Step, string> = {
        email: 'Enter your email to continue',
        password: `Welcome back`,
        'setup-sent': `Check your inbox`,
        'reset-sent': 'Check your inbox',
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-3 pb-4">
                    <img 
                        src="/affiliatemango_logo.png" 
                        alt="AffiliateMango Logomark" 
                        className="w-12 h-12 object-contain mx-auto"
                    />
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">Sign In</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">{subtitle[step]}</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

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
                                {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Checking…</> : 'Continue'}
                            </Button>
                        </form>
                    )}

                    {step === 'password' && (
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
                            <div className="flex items-center justify-between">
                                <Button type="submit" disabled={isPending}
                                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold">
                                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : 'Sign In'}
                                </Button>
                            </div>
                            <button type="button" onClick={handleForgotPassword} disabled={isPending}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1">
                                Forgot password?
                            </button>
                        </form>
                    )}

                    {step === 'setup-sent' && (
                        <div className="text-center space-y-4 py-2">
                            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                <Mail className="w-7 h-7 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-zinc-200 font-medium">Password setup link sent</p>
                                <p className="text-orange-400 font-mono text-sm mt-1">{email}</p>
                            </div>
                            <p className="text-zinc-500 text-sm">
                                Click the link in your email to set your password and access your account.
                                Check your spam folder if you don't see it.
                            </p>
                            <button type="button" onClick={() => { setStep('email'); setError(null); }}
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                ← Use a different email
                            </button>
                        </div>
                    )}

                    {step === 'reset-sent' && (
                        <div className="text-center space-y-4 py-2">
                            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                <Mail className="w-7 h-7 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-zinc-200 font-medium">Password reset link sent</p>
                                <p className="text-orange-400 font-mono text-sm mt-1">{email}</p>
                            </div>
                            <p className="text-zinc-500 text-sm">
                                Click the link in your email to set a new password. Check your spam folder if you don't see it.
                            </p>
                            <button type="button" onClick={() => { setStep('email'); setError(null); }}
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                ← Back to sign in
                            </button>
                        </div>
                    )}
                </CardContent>

                {!isDashboard && (
                    <div className="mt-6 text-center text-sm">
                        <span className="text-zinc-500">Don't have an account? </span>
                        <a href="/" className="text-orange-400 font-medium hover:underline">Apply as Affiliate</a>
                    </div>
                )}
            </Card>
        </div>
    );
}
