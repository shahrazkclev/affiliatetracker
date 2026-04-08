import { BarChart3, CloudLightning, Code, ShieldCheck, UserPlus, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function Features() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f3f4f6]">


      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32">
        <div className="text-center max-w-3xl mb-24 relative">
          <img src="/affiliatemango_logo.png" alt="AffiliateMango Motif" className="absolute -top-24 -right-24 w-48 h-48 scale-150 opacity-30 transform rotate-12 drop-shadow-2xl object-contain pointer-events-none" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">Everything you need to run a world-class affiliate program.</h1>
          <p className="text-lg text-zinc-400">
            Automate tracking, bypass complex integrations, and get payouts directly injected into your existing Stripe infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full text-left relative">
          {/* Subtle floating background mango in the grid */}
          <img src="/affiliatemango_logo.png" alt="AffiliateMango Motif" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] scale-150 opacity-5 pointer-events-none drop-shadow-2xl z-0 object-contain" />
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative z-10">
            <UserPlus className="w-8 h-8 text-orange-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">One-Click Affiliate Onboarding</h3>
            <p className="text-zinc-400 leading-relaxed">
              Generate magic links that instantly invite affiliates to your portal. They configure their payment methods and grab tracking links in seconds.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <CloudLightning className="w-8 h-8 text-blue-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Sub-millisecond Tracking</h3>
            <p className="text-zinc-400 leading-relaxed">
              Our vanilla JS tracking snippet runs lightning fast. It stores attribution metadata securely without slowing down your marketing homepage.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <Webhook className="w-8 h-8 text-emerald-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Stripe Webhook Sync</h3>
            <p className="text-zinc-400 leading-relaxed">
              When an affiliate drives a checkout, the tracking metadata automatically pairs with Stripe's \`checkout.session.completed\` webhooks to guarantee perfect tracking.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <Code className="w-8 h-8 text-purple-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Custom Server APIs</h3>
            <p className="text-zinc-400 leading-relaxed">
              Fully documented REST APIs. If you don't want to use our frontend widgets, you can push raw conversion events directly from your server.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <ShieldCheck className="w-8 h-8 text-rose-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Fraud Protection</h3>
            <p className="text-zinc-400 leading-relaxed">
              Database constraints prevent duplicate payouts from the same Stripe transaction, ensuring your revenue metrics are bulletproof.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <BarChart3 className="w-8 h-8 text-amber-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Live Commission Dashboards</h3>
            <p className="text-zinc-400 leading-relaxed">
              Your affiliates get access to a beautiful, real-time portal where they can monitor their clicks, conversions, and pending payouts instantly.
            </p>
          </div>

        </div>
      </main>

      <footer className="border-t border-zinc-900 py-10 text-center text-zinc-600 text-sm mt-12">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
          <a href="/legal/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          <a href="/legal/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
        </div>
        &copy; {new Date().getFullYear()} AffiliateMango. Designed for high-performance SaaS.
      </footer>
    </div>
  );
}
