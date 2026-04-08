'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function PaywallWrapper({ 
  isExpired, 
  children 
}: { 
  isExpired: boolean; 
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isExpired && pathname !== '/admin/billing') {
    return (
      <div className="relative w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                🔒
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Trial Expired</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
                Your 14-day free trial has officially expired. To regain access to your affiliates, payouts, and portal configurations, you must upgrade to an active subscription.
            </p>

            <Link href="/admin/billing" className="inline-block bg-brand-orange hover:bg-brand-orange/90 text-white font-medium py-3 px-8 rounded-lg transition shadow-lg shadow-brand-orange/20">
                View Billing Options
            </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
