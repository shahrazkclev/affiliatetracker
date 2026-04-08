export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-black text-zinc-300 font-sans selection:bg-orange-500/30">
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="flex items-center group">
              <img src="/affiliatemango_logo.png" alt="AffiliateMango Logo" className="w-20 h-20 object-contain scale-[1.5] -my-6 -ml-4 -mr-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform group-hover:scale-[1.7]" />
              <span className="text-2xl font-black text-white tracking-tight">
                Affiliate<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Mango</span>
              </span>
            </a>
            <div className="hidden md:flex gap-8">
              <a href="/features" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Features</a>
              <a href="/pricing" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Pricing</a>
              <a href="/docs/api" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Docs</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://partners.cleverpoly.store/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Sign in</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-32 md:py-40">
        <div className="prose prose-invert prose-orange max-w-none">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-zinc-900 py-10 mt-12 text-center text-zinc-600 text-sm">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
          <a href="/legal/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          <a href="/legal/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
        </div>
        &copy; {new Date().getFullYear()} AffiliateMango. Designed for high-performance SaaS.
      </footer>
    </div>
  );
}
