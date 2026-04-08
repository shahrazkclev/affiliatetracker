'use client';
import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitAffiliateApplication } from "@/app/actions";
import { AlertCircle, Loader2 } from 'lucide-react';

function ApplyDetailsPageInner() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await submitAffiliateApplication(fd);
            if (result?.error) setError(result.error);
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-3 pb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
                        C
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">Complete Your Application</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            Email confirmed ✓ — fill in your details to apply
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
                            <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                            <Input id="name" name="name" type="text" placeholder="John Doe" required autoFocus
                                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referralCode" className="text-zinc-300 text-sm">
                                Referral Code <span className="text-zinc-500 font-normal">(your custom link ID)</span>
                            </Label>
                            <Input id="referralCode" name="referralCode" type="text"
                                placeholder="e.g. johndoe" required
                                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50 font-mono" />
                            <p className="text-[11px] text-zinc-600">Your link: site.com?via=<span className="text-orange-400">code</span></p>
                        </div>

                        <Button type="submit" disabled={isPending}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white mt-2 h-11 font-semibold disabled:opacity-60">
                            {isPending
                                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
                                : 'Submit Application'}
                        </Button>
                        <p className="text-[11px] text-zinc-600 text-center">Your application will be reviewed before activation</p>
                        <input type="hidden" name="org_id" value={searchParams.get('org_id') || ''} />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ApplyDetailsPage() {
    return (
        <Suspense>
            <ApplyDetailsPageInner />
        </Suspense>
    );
}
