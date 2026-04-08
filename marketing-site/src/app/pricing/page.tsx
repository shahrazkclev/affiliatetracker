import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f3f4f6]">


      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">Simple, transparent pricing</h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-16">
          Everything you need to scale your SaaS revenue without giving up 30% to legacy networks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left">
          
          {/* Free Plan */}
          <div className="bg-[#0f0f0f] border border-zinc-800 p-8 rounded-3xl flex flex-col hover:border-zinc-700 transition-colors">
            <h3 className="text-2xl font-bold mb-2">Hobby</h3>
            <p className="text-zinc-500 mb-6 text-sm">Test the waters and launch your first program completely free.</p>
            <div className="text-5xl font-extrabold mb-8">$0<span className="text-xl text-zinc-500 font-medium tracking-normal">/mo</span></div>
            
            <ul className="space-y-4 mb-10 flex-1">
              {['Up to 5 active affiliates', 'Basic Link Tracking', 'Standard Support'].map((feature, i) => (
                <li key={i} className="flex gap-3 text-zinc-400 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a href="https://partners.cleverpoly.store" className="block text-center w-full py-3 border border-zinc-800 hover:bg-zinc-800/50 font-bold rounded-xl transition-colors text-zinc-300">Start Free</a>
          </div>

          {/* Starter Plan */}
          <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl flex flex-col relative shadow-xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
            <p className="text-zinc-400 mb-6 text-sm">Perfect for early-stage software startups gaining traction.</p>
            <div className="text-5xl font-extrabold mb-8 text-white">$24<span className="text-xl text-zinc-500 font-medium tracking-normal">/mo</span></div>
            
            <ul className="space-y-4 mb-10 flex-1">
              {['Up to 50 active affiliates', 'Unlimited clicks & tracking', 'Stripe checkout integration', 'Basic Email Automation', 'Community Discord Support'].map((feature, i) => (
                <li key={i} className="flex gap-3 text-zinc-200 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a href="https://partners.cleverpoly.store" className="block text-center w-full py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl transition-colors text-white">Start 14-Day Free Trial</a>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/50 shadow-[0_0_40px_-15px_rgba(249,115,22,0.3)] p-8 rounded-3xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
            <div className="absolute top-6 right-6 bg-orange-500/20 text-orange-400 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex items-center">Most Popular <img src="/affiliatemango_logo.png" alt="Motif" className="w-8 h-8 object-contain inline-block scale-[1.5] -my-2 -mr-2" /></div>
            
            <h3 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">Pro</h3>
            <p className="text-zinc-400 mb-6 text-sm">For scaling enterprise applications.</p>
            <div className="text-5xl font-extrabold mb-8 text-white">$49<span className="text-xl text-zinc-500 font-medium tracking-normal">/mo</span></div>
            
            <ul className="space-y-4 mb-10 flex-1">
              {['Unlimited affiliates', 'Custom Webhooks & API Access', 'Custom White-labeling', 'Advanced Fraud Detection', 'Automated Bulk Payouts', 'Priority SLA 24/7 Support'].map((feature, i) => (
                <li key={i} className="flex gap-3 text-white text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)] rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a href="https://partners.cleverpoly.store" className="block text-center w-full py-3 bg-orange-500 hover:bg-orange-400 font-bold rounded-xl transition-colors text-white shadow-lg shadow-orange-500/25">Scale with Pro</a>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="max-w-5xl w-full mt-32 mb-16 px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight">How we stack up</h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Don't overpay for basic affiliate tracking. See exactly why AffiliateMango is the smarter choice for modern SaaS founders.</p>
          </div>
          
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto p-4 md:p-8">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
              <thead>
                <tr className="text-sm">
                  <th className="p-6 font-semibold text-zinc-400 w-[30%] border-b border-zinc-800/50">Features & Pricing</th>
                  <th className="p-6 font-black text-xl text-white w-[25%] bg-gradient-to-b from-orange-500/20 to-orange-500/5 rounded-t-3xl border-t border-x border-orange-500/40 text-center shadow-[inset_0_2px_0_rgba(249,115,22,0.3)] relative z-10">Affiliate<span className="text-orange-500">Mango</span></th>
                  <th className="p-6 font-semibold text-zinc-500 w-[22%] text-center border-b border-zinc-800/50">Rewardful</th>
                  <th className="p-6 font-semibold text-zinc-500 w-[23%] text-center border-l border-b border-zinc-800/50">Tapfiliate</th>
                </tr>
              </thead>
              <tbody className="text-base">
                <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200 border-b border-zinc-800/50">Starting Price</td>
                  <td className="p-6 font-bold text-white border-x border-orange-500/50 bg-orange-500/5 text-center text-lg relative z-10 shadow-[0_4px_30px_rgba(249,115,22,0.05)]">$24/mo</td>
                  <td className="p-6 text-zinc-400 text-center border-b border-zinc-800/50 group-hover:text-zinc-300">$49/mo</td>
                  <td className="p-6 text-zinc-400 text-center border-l border-b border-zinc-800/50 group-hover:text-zinc-300">$89/mo</td>
                </tr>
                <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200 border-b border-zinc-800/50">Unlimited Affiliates Price</td>
                  <td className="p-6 font-bold text-white border-x border-orange-500/50 bg-orange-500/5 text-center text-lg relative z-10 shadow-[0_4px_30px_rgba(249,115,22,0.05)]">$49/mo</td>
                  <td className="p-6 text-zinc-400 text-center border-b border-zinc-800/50 opacity-70 group-hover:opacity-100">$149+/mo</td>
                  <td className="p-6 text-zinc-400 text-center border-l border-b border-zinc-800/50 opacity-70 group-hover:opacity-100">$149+/mo</td>
                </tr>
                <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200 border-b border-zinc-800/50">Stripe Integration</td>
                  <td className="p-6 text-center border-x border-orange-500/50 bg-orange-500/5 relative z-10 shadow-[0_4px_30px_rgba(249,115,22,0.05)]"><CheckCircle2 className="w-6 h-6 mx-auto text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /></td>
                  <td className="p-6 text-center border-b border-zinc-800/50"><CheckCircle2 className="w-5 h-5 mx-auto text-zinc-500 group-hover:text-zinc-400" /></td>
                  <td className="p-6 text-center border-l border-b border-zinc-800/50"><CheckCircle2 className="w-5 h-5 mx-auto text-zinc-500 group-hover:text-zinc-400" /></td>
                </tr>
                 <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200 flex items-center gap-2 border-b border-zinc-800/50">Automated Notifications <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">Crucial</span></td>
                  <td className="p-6 text-center border-x border-orange-500/50 bg-orange-500/5 relative z-10 shadow-[0_4px_30px_rgba(249,115,22,0.05)]"><CheckCircle2 className="w-6 h-6 mx-auto text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /></td>
                  <td className="p-6 text-center text-zinc-600 font-bold border-b border-zinc-800/50">—</td>
                  <td className="p-6 text-center text-zinc-600 font-bold border-l border-b border-zinc-800/50">—</td>
                </tr>
                <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200 border-b border-zinc-800/50 block w-full h-full">Modern Developer APIs</td>
                  <td className="p-6 text-center border-x border-orange-500/50 bg-orange-500/5 relative z-10 shadow-[0_4px_30px_rgba(249,115,22,0.05)]"><CheckCircle2 className="w-6 h-6 mx-auto text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /></td>
                  <td className="p-6 text-center border-b border-zinc-800/50"><CheckCircle2 className="w-5 h-5 mx-auto text-zinc-500 group-hover:text-zinc-400" /></td>
                  <td className="p-6 text-center border-l border-b border-zinc-800/50"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded">Limited</span></td>
                </tr>
                <tr className="group hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6 font-medium text-zinc-200">Transaction Fees</td>
                  <td className="p-6 font-black text-emerald-400 border-x border-b border-orange-500/40 bg-orange-500/5 text-center text-lg rounded-b-3xl relative z-10 shadow-[inset_0_-2px_0_rgba(249,115,22,0.3),0_4px_30px_rgba(249,115,22,0.05)]">0%</td>
                  <td className="p-6 text-zinc-400 text-center font-bold">0%</td>
                  <td className="p-6 text-zinc-400 text-center font-bold border-l border-zinc-800/50">0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
