'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitFullApplication } from "@/app/actions";
import { loginWithPassword } from "@/app/login/actions";
import { AlertCircle, Loader2, Mail, CheckCircle2, RefreshCw } from 'lucide-react';

function friendlyAuthError(code: string | null, description: string | null): string | null {
    if (!code && !description) return null;
    if (code === 'otp_expired') return 'That confirmation link has expired. Please request a new application link below.';
    if (code === 'access_denied') return description?.replace(/\+/g, ' ') ?? 'Access was denied. Please try again.';
    return description?.replace(/\+/g, ' ') ?? 'Something went wrong. Please try again.';
}

function AffiliateRegistrationPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<'form' | 'sent' | 'password'>('form');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSending, startSending] = useTransition();

    // Handle all Supabase redirects that land on the home page
    useEffect(() => {
        const errorCode = searchParams.get('error_code');
        const errorDesc = searchParams.get('error_description');
        const code = searchParams.get('code');

        // Clean up URL parameters if present
        if (errorCode || errorDesc || code) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        // Show error message if Supabase returned one
        const msg = friendlyAuthError(errorCode, errorDesc);
        if (msg) { setError(msg); return; }

        if (code) {
            const supabase = createClient();
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    setError('This link is invalid or has expired. Please try again.');
                } else {
                    router.replace('/reset-password');
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const typedEmail = (fd.get('email') as string).trim().toLowerCase();
        const typedName = (fd.get('name') as string).trim();
        const typedRef = (fd.get('referralCode') as string).trim();

        setEmail(typedEmail);
        setName(typedName);
        setReferralCode(typedRef);

        startSending(async () => {
            const result = await submitFullApplication(fd);
            if (result?.error) { setError(result.error); return; }
            if (result?.existingUser) {
                setStep('password');
                return;
            }
            setStep('sent');
        });
    }

    async function handleResend() {
        setError(null);
        startSending(async () => {
            const fd = new FormData();
            fd.set('email', email);
            fd.set('name', name);
            fd.set('referralCode', referralCode);
            fd.set('org_id', searchParams.get('org_id') || searchParams.get('org_slug') || '');
            const result = await submitFullApplication(fd);
            if (result?.error) setError(result.error);
        });
    }

    async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set('email', email);
        startSending(async () => {
            const result = await loginWithPassword(fd);
            if (result?.error) setError(result.error);
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-3 pb-4">
                    <img 
                        src="/affiliatemango_logo.png" 
                        alt="AffiliateMango" 
                        className="w-12 h-12 object-contain mx-auto"
                    />
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">Join the Affiliate Program</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            {step === 'sent' && 'A confirmation link has been sent to your email'}
                            {step === 'password' && <span className="text-orange-400">Account found. Welcome back!</span>}
                            {step === 'form' && 'Fill out your details to apply'}
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

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="hidden" name="org_id" value={searchParams.get('org_id') || searchParams.get('org_slug') || ''} />
                            
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300 text-sm">Email Address</Label>
                                <Input id="email" name="email" type="email" placeholder="you@example.com"
                                    required autoFocus defaultValue={email}
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                                <Input id="name" name="name" type="text" placeholder="John Doe"
                                    required defaultValue={name}
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="referralCode" className="text-zinc-300 text-sm">
                                    Referral Code <span className="text-zinc-500 font-normal">(your custom link ID)</span>
                                </Label>
                                <Input id="referralCode" name="referralCode" type="text"
                                    placeholder="e.g. johndoe" required defaultValue={referralCode}
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50 font-mono" />
                                <p className="text-[11px] text-zinc-600">Your link: site.com?via=<span className="text-orange-400">code</span></p>
                            </div>

                            <Button type="submit" disabled={isSending}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold disabled:opacity-60 mt-2">
                                {isSending
                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting Application…</>
                                    : 'Submit Application'}
                            </Button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg text-sm text-zinc-400 mb-4">
                                <span className="truncate flex-1">{email}</span>
                                <button type="button" onClick={() => { setStep('form'); setError(null); }}
                                    className="text-[11px] text-orange-400 hover:underline shrink-0">Change</button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 text-sm">Welcome back! Please enter your password</Label>
                                <Input id="password" name="password" type="password" required autoFocus
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                            </div>
                            <Button type="submit" disabled={isSending}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 font-semibold disabled:opacity-60">
                                {isSending
                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing In…</>
                                    : 'Sign In'}
                            </Button>
                            <a href="/login" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2">
                                Forgot password?
                            </a>
                        </form>
                    )}

                    {step === 'sent' && (
                        <div className="space-y-5">
                            {/* Email sent info */}
                            <div className="flex items-start gap-3 bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4">
                                <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                    <Mail className="w-4.5 h-4.5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-zinc-200 text-sm font-medium">Check your inbox to complete sign up</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        We sent a confirmation link to <span className="text-orange-400">{email}</span>.
                                        Click the link in your email to verify your address.
                                    </p>
                                </div>
                            </div>

                            {/* Steps */}
                            <ol className="space-y-2 text-sm">
                                {[
                                    'Open the email in your inbox',
                                    'Click the confirmation link',
                                    'Your application will be submitted for review!',
                                ].map((s, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-400">
                                        <span className="w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-[11px] text-zinc-500 shrink-0">
                                            {i + 1}
                                        </span>
                                        {s}
                                    </li>
                                ))}
                            </ol>

                            {/* Resend */}
                            <button type="button" onClick={handleResend} disabled={isSending}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-2 bg-zinc-800/60 border border-zinc-700 rounded-lg">
                                <RefreshCw className="w-3.5 h-3.5" />
                                {isSending ? 'Resending…' : 'Resend confirmation link'}
                            </button>

                            <button type="button" onClick={() => { setStep('form'); setError(null); }}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center">
                                ← Edit application details
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm">
                        <span className="text-zinc-500">Already have an account? </span>
                        <a href="/login" className="text-orange-400 font-medium hover:underline">Sign in</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AffiliateRegistrationPage() {
    return (
        <Suspense>
            <AffiliateRegistrationPageInner />
        </Suspense>
    );
}
