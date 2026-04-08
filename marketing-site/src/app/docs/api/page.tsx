import { Code, Key, Link as LinkIcon, RefreshCw, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function ApiDocs() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f3f4f6]">
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-zinc-900 p-6 hidden md:block sticky top-[89px] max-h-[calc(100vh-89px)] overflow-y-auto">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Getting Started</h4>
          <ul className="space-y-3 text-sm text-zinc-400 mb-8">
            <li><a href="#quickstart" className="hover:text-orange-400 transition-colors block">Quickstart</a></li>
            <li><a href="#authentication" className="hover:text-orange-400 transition-colors block">Authentication</a></li>
            <li><a href="#error-handling" className="hover:text-orange-400 transition-colors block">Error Handling</a></li>
          </ul>

          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Endpoints</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="#referrals" className="hover:text-zinc-200 transition-colors flex items-center gap-2"><span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded uppercase font-bold shrink-0">GET</span> Referrals</a></li>
            <li><a href="#log-event" className="hover:text-zinc-200 transition-colors flex items-center gap-2"><span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded uppercase font-bold shrink-0">POST</span> Log Event</a></li>
            <li><a href="#webhook" className="hover:text-zinc-200 transition-colors flex items-center gap-2"><span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 rounded uppercase font-bold shrink-0">POST</span> Webhook</a></li>
          </ul>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold mb-4">API Documentation</h1>
            <p className="text-zinc-400 text-lg mb-10">
              Integrate the AffiliateMango engine directly into your custom stack. Automate affiliate attribution, track specific click events, and ingest real-time payloads.
            </p>

            <section id="quickstart" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-bold mb-4">Quickstart</h2>
              <p className="text-zinc-400 leading-relaxed">
                To start tracking clicks manually, you don't even need an API integration. Simply drop our JS SDK Snippet onto your frontend. The snippet automatically searches for <code className="text-orange-400 bg-orange-400/10 px-1 rounded">?ref=</code> query parameters and stores attribution cookies.
              </p>
            </section>

            <section id="authentication" className="mb-16 scroll-mt-28">
              <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl flex gap-4">
                <Key className="w-6 h-6 text-orange-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-orange-400 mb-1 flex items-center">API Authentication <img src="/affiliatemango_logo.png" alt="Motif" className="w-12 h-12 object-contain scale-[1.5] -my-4 -mr-2" /></h3>
                  <p className="text-sm text-orange-400/80 leading-relaxed">All endpoints require a Bearer token. Grab your Secret Key from the System settings in your Dashboard and send it in the Authorization header. Do not leak this offline.</p>
                </div>
              </div>
            </section>

            <section id="error-handling" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-bold mb-4 flex items-center">Error Handling <img src="/affiliatemango_logo.png" alt="Motif" className="w-16 h-16 object-contain scale-[1.5] -my-4 -ml-2 -mr-4" /></h2>
              <p className="text-zinc-400 mb-4">We return standard HTTP response codes to indicate success or failure.</p>
              <ul className="list-disc pl-5 text-zinc-400 space-y-2">
                <li><strong className="text-zinc-200">200 / 201:</strong> Success. Payload parsed correctly.</li>
                <li><strong className="text-zinc-200">400:</strong> Bad Request - Validation issue in the payload body.</li>
                <li><strong className="text-zinc-200">401:</strong> Unauthorized - Missing or invalid Bearer secret token.</li>
              </ul>
            </section>

            <div className="space-y-16">
              
              {/* Endpoint 1: Referrals */}
              <section id="referrals" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-md uppercase font-bold tracking-widest border border-green-500/30">GET</span>
                  <span className="text-xl font-bold font-mono text-zinc-200">/api/v1/referrals</span>
                </div>
                <p className="text-zinc-400 mb-6 leading-relaxed">Fetch a paginated list of all active affiliates and their conversion statistics.</p>
              </section>

              {/* Endpoint 2: Events */}
              <section id="log-event" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md uppercase font-bold tracking-widest border border-blue-500/30">POST</span>
                  <span className="text-xl font-bold font-mono text-zinc-200">/api/v1/events</span>
                </div>
                <p className="text-zinc-400 mb-6 leading-relaxed">Log an affiliate click/conversion event directly from your backend if you prefer server-side tracking over the client snippet.</p>
                
                <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden relative shadow-lg">
                  <div className="absolute top-0 inset-x-0 h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                      <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                      <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                    </div>
                    <span className="ml-4 text-xs font-mono text-zinc-500">cURL Example</span>
                  </div>
                  <pre className="p-6 pt-14 text-sm font-mono text-zinc-300 overflow-x-auto selection:bg-orange-500/30">
{`curl -X POST https://partners.cleverpoly.store/api/v1/events \\
  -H "Authorization: Bearer sk_live_exyz..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "affiliate_id": "aff_xyz123",
    "event_type": "click",
    "metadata": { "source": "email_campaign" }
  }'`}
                  </pre>
                </div>
              </section>

              {/* Endpoint 3: Webhook */}
              <section id="webhook" className="scroll-mt-28">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Webhook className="w-5 h-5 text-orange-500" /> Webhook Integrations</h2>
                <p className="text-zinc-400 mb-6 leading-relaxed">Receive real-time payloads when commissions are generated or payouts are requested so you can process rewards offline.</p>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
                  <p className="text-sm font-mono text-zinc-500 mb-4">// Example Payload (Commission Generated)</p>
                  <pre className="text-sm font-mono text-emerald-400 overflow-x-auto selection:bg-emerald-500/30">
{`{
  "type": "commission.created",
  "data": {
    "id": "com_889",
    "stripe_charge_id": "ch_...123",
    "amount": 49.00,
    "affiliate": "aff_xyz123"
  }
}`}
                  </pre>
                </div>
              </section>
            </div>

          </div>
        </main>
      </div>

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
