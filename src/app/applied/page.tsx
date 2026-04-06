import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function AppliedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] p-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Application Submitted!</h1>
                    <p className="text-zinc-400 mt-3 leading-relaxed">
                        Your affiliate application is under review. We'll send you an email once you're approved and ready to start promoting.
                    </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">What happens next</p>
                    <ul className="space-y-1.5 text-sm text-zinc-400">
                        <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">1.</span> Admin reviews your application</li>
                        <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">2.</span> You receive an approval email</li>
                        <li className="flex items-start gap-2"><span className="text-orange-400 shrink-0">3.</span> Sign in and set your password to access the portal</li>
                    </ul>
                </div>
                <Link href="/login" className="inline-block text-sm text-orange-400 hover:underline">
                    Go to sign in →
                </Link>
            </div>
        </div>
    );
}
