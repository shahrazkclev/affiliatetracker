'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ReferralsTabs() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'sales';

    return (
        <div className="flex items-center gap-6 border-b border-zinc-800 mb-6">
            <Link 
                href="?tab=sales" 
                className={`py-3 text-sm font-medium transition-colors relative ${tab === 'sales' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
                Sales & Commissions
                {tab === 'sales' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
            </Link>
            <Link 
                href="?tab=customers" 
                className={`py-3 text-sm font-medium transition-colors relative ${tab === 'customers' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
                Customers
                {tab === 'customers' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
            </Link>
        </div>
    );
}
