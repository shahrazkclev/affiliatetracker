'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CloudLightning, ShieldCheck, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f3f4f6]">


      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl relative"
        >
          {/* Subtle Mango Branding Header motif */}
          <motion.img 
            src="/affiliatemango_logo.png" alt="AffiliateMango Motif"
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} 
            className="absolute -top-24 -left-12 md:-left-32 w-64 h-64 scale-150 opacity-20 pointer-events-none drop-shadow-2xl z-0 object-contain"
          />

          <div className="inline-flex items-center justify-center space-x-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-semibold mb-8 tracking-wide relative z-10">
            <CloudLightning className="w-4 h-4" />
            <span>v2.0 Affiliate Engine is Live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Add an affiliate engine to your website with <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500">
              Automated Affiliates.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create powerful affiliate programs in minutes. We handle the Stripe webhooks, commission logic, and payouts natively—no bloated middlemen, no 30% cuts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing" className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] transition-all flex items-center justify-center gap-2 group">
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/docs/api" className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-lg transition-all">
              View Documentation
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid Extract */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full text-left"
        >
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
            <Webhook className="w-10 h-10 text-orange-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Native Webhook Sync</h3>
            <p className="text-zinc-400 line-clamp-3">Connects directly into your Stripe and your servers. Instant commissions on every matched checkout session without manual polling.</p>
          </div>
          
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" />
            <BarChart3 className="w-10 h-10 text-rose-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Live Attribution</h3>
            <p className="text-zinc-400 line-clamp-3">Sub-millisecond tracking pixels and secure API logging ensures every click and subsequent purchase is attributed perfectly to your partners.</p>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Fraud Prevention</h3>
            <p className="text-zinc-400 line-clamp-3">Duplicate checkout protection, intelligent anomaly detection, and automated payouts powered natively by row-level secure logic.</p>
          </div>
        </motion.div>
      </main>

      {/* Setup / How it works Section */}
      <section className="border-t border-zinc-900 bg-black py-24 px-4 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Integrate your app in 5 minutes.</h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              No complicated backend logic required. Generate a snippet from your dashboard and drop it globally on your client side. We trace unique sessions dynamically and associate payouts to Stripe Checkouts securely.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <div className="bg-orange-500/10 text-orange-400 p-2 rounded-full"><Webhook className="w-5 h-5" /></div>
                <span className="text-zinc-300 font-medium">Automatic URL Detection</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-rose-500/10 text-rose-400 p-2 rounded-full"><BarChart3 className="w-5 h-5" /></div>
                <span className="text-zinc-300 font-medium">90 Day Deep Cookie Storage</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-purple-500/10 text-purple-400 p-2 rounded-full"><ShieldCheck className="w-5 h-5" /></div>
                <span className="text-zinc-300 font-medium">Spam Protection Native</span>
              </li>
            </ul>
            <Link href="/docs/api" className="text-orange-400 font-bold hover:underline inline-flex items-center gap-2">
              Read Developer Docs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-purple-500/10 blur-[100px] -z-10 rounded-full" />
            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
              </div>
              <pre className="p-6 text-sm font-mono text-zinc-300 overflow-x-auto selection:bg-orange-500/30">
{`<!-- Place this in the <head> of your site -->
<script
  src="https://partners.cleverpoly.store/mango.js"
  data-org-id="org_123abc"
  data-cookie-duration="90"
  async
></script>

<!-- Log a conversion with Stripe later! -->
<script>
  window.Mango?.logPurchase({
    amount: 149.00,
    stripeEventId: "evt_..." 
  });
</script>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard App Detail Section */}
      <section className="py-32 px-4 w-full bg-[#0a0a0a] relative overflow-hidden border-t border-zinc-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center mb-24 relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight relative">
            <img src="/affiliatemango_logo.png" alt="AffiliateMango Motif" className="absolute -left-24 -top-24 w-48 h-48 scale-150 opacity-30 transform -rotate-12 pointer-events-none drop-shadow-2xl object-contain" />
            Everything you need,<br/>beautifully designed.
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl px-4">Give your affiliates a world-class experience while retaining absolute control over approvals, percentages, and payouts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-7xl mx-auto relative z-10 items-center">
          
          {/* Feature Block 1: Affiliate Portal */}
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <h3 className="text-3xl font-bold mb-4 text-white">White-labeled Partner Portals</h3>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              When affiliates join, they get instant access to a gorgeous, lightning-fast dashboard where they can copy their unique `?ref=` links, view their real-time conversion graphs, and track incoming payouts securely.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">Custom referral link generation natively included.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">Live analytics graphing clicks and pipeline conversions.</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-2 shadow-2xl relative order-1 lg:order-2">
            <div className="bg-[#0f0f0f] w-full h-[400px] rounded-2xl border border-zinc-800 shadow-inner relative overflow-hidden flex flex-col">
              {/* Mock Dashboard UI */}
              <div className="h-14 border-b border-zinc-800/80 flex items-center px-6 justify-between bg-[#111]">
                <div className="font-bold text-sm tracking-tight">Affiliate<span className="text-orange-500">Mango</span></div>
                <div className="flex gap-2"><div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse"></div></div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 bg-[#0a0a0a]">
                <div className="flex gap-3">
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                     <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Clicks</div>
                     <div className="text-2xl font-bold">1,204</div>
                  </div>
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                     <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Sales</div>
                     <div className="text-2xl font-bold">89</div>
                  </div>
                  <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 shadow-[0_0_20px_-10px_rgba(249,115,22,0.3)]">
                     <div className="text-orange-500/80 text-[10px] uppercase font-bold tracking-widest mb-1">Earnings</div>
                     <div className="text-2xl text-orange-400 font-bold">$4,450</div>
                  </div>
                </div>
                <div className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 relative overflow-hidden flex flex-col">
                   <div className="text-sm font-medium mb-4">Traffic Performance</div>
                   {/* Mock graph */}
                   <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-orange-500/10 to-transparent flex items-end px-4 gap-2 pb-4">
                     {[40, 60, 45, 80, 50, 90, 70, 85].map((h, i) => (
                       <div key={i} className="flex-1 bg-orange-500/40 rounded-t-sm transition-all hover:bg-orange-500/60" style={{ height: `${h}%` }}></div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Block 2: Admin Dashboard */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-2 shadow-xl relative order-3">
            <div className="bg-[#0f0f0f] w-full h-[400px] rounded-2xl border border-zinc-800 shadow-inner relative overflow-hidden flex">
              {/* Mock Admin UI */}
              <div className="w-16 border-r border-zinc-800 bg-[#111] flex flex-col items-center py-6 gap-6">
                 <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center"><Webhook className="w-5 h-5 text-zinc-900" /></div>
                 <div className="w-6 h-6 rounded bg-zinc-800"></div>
                 <div className="w-6 h-6 rounded bg-zinc-800"></div>
                 <div className="w-6 h-6 rounded bg-zinc-800"></div>
              </div>
              <div className="flex-1 p-6 bg-[#0a0a0a] flex flex-col gap-4">
                <div className="text-lg font-bold mb-2 flex items-center justify-between">
                  Pending Payouts
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold uppercase">Ready</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center font-bold text-xs">P{i}</div>
                      <div>
                        <div className="text-sm font-bold">Partner {i}</div>
                        <div className="text-xs text-zinc-500">connect_acc...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-emerald-400">+${i * 150}.00</div>
                        <div className="text-[10px] text-zinc-600 uppercase font-bold">Stripe Connect</div>
                      </div>
                      <div className="h-8 px-3 bg-zinc-800 group-hover:bg-orange-500 text-white rounded text-xs font-bold flex items-center justify-center transition-colors">Approve</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center order-4">
            <h3 className="text-3xl font-bold mb-4 text-white">Automated Admin Control</h3>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              No more manual spreadsheets or disjointed PayPal sending. Our Admin Panel lets you view all pending commissions natively. Review automatically flagged fraud transactions, click 'Approve', and let the Stripe Connect integration handle direct deposit securely in bulk.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">1-click bulk payouts mapped directly via Stripe.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">Unified tracking for every affiliate's lifecycle.</span>
              </li>
            </ul>
          </div>

          {/* Feature Block 3: Notifications */}
          <div className="flex flex-col justify-center order-6 lg:order-5">
            <h3 className="text-3xl font-bold mb-4 text-white">Instant Event Notifications</h3>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Keep your affiliates engaged and motivated with automated transactional emails. From welcome sequences to real-time commission alerts, our built-in notification engine handles delivery seamlessly.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">"New Commission" alerts for partners.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <span className="text-zinc-300">"Payout Sent" verification receipts.</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-2 shadow-2xl relative order-5 lg:order-6">
            <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent blur-xl rounded-3xl" />
            <div className="bg-[#0f0f0f] w-full h-[400px] rounded-2xl border border-zinc-800 shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
              {/* Mock Email Notifications UI */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-purple-500/5 to-transparent flex items-start justify-center pt-8">
                <div className="w-24 h-1 bg-purple-500/20 rounded-full blur-sm"></div>
              </div>
              
              <div className="relative z-10 w-full px-8 space-y-4">
                {/* Notification 1 */}
                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 shadow-xl transform transition-transform hover:-translate-y-1 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">New Conversion!</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Just now</span>
                  </div>
                  <p className="text-sm text-zinc-400">Someone just purchased the Pro plan using your link. You earned <strong className="text-emerald-400">$29.50</strong>!</p>
                </div>
                
                {/* Notification 2 */}
                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 shadow-xl transform transition-transform hover:-translate-y-1 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Payout Sent</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">2h ago</span>
                  </div>
                  <p className="text-sm text-zinc-400">Good news! We've processed your pending commissions. <strong className="text-white">$450.00</strong> is on its way to your account.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center">Frequently Asked Questions <motion.img src="/affiliatemango_logo.png" alt="FAQ Motif" animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="inline-block w-24 h-24 object-contain scale-[1.5] -my-6 -mr-8 -ml-2" /></h2>
          <p className="text-zinc-400 text-lg">Everything you need to know about scaling via Referral Programs.</p>
        </div>
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-3">Does it work with customized checkouts?</h3>
            <p className="text-zinc-400">Absolutely. As long as you generate Webhooks on successful checkout, we attribute the sale automatically—even if they buy months later on a different domain.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-3">How are affiliates paid out?</h3>
            <p className="text-zinc-400">Commissions calculate instantly in the system. When it's time for payout, we securely integrate with Stripe Connect allowing bulk transfers, ensuring no middle-man fees except standard routing costs.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-3">Do I need extensive development experience?</h3>
            <p className="text-zinc-400">If you can paste a Javascript tag inside a website builder (like Framer, Webflow, or Shopify), you're ready to go. The automated backend handles everything securely.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-900 relative overflow-hidden py-32 text-center px-4 flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-500/10 pointer-events-none" />
        <h2 className="text-5xl font-extrabold mb-6 relative z-10">Ready to boost your revenue?</h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-xl mx-auto relative z-10">Join top businesses leveraging massive commission networks securely and autonomously.</p>
        <a href="https://partners.cleverpoly.store" className="relative z-10 px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all">
          Build Your Program Now
        </a>
      </section>
      
      {/* Footer Minimal */}
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
