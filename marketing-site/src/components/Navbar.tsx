'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="w-full flex justify-between items-center px-6 md:px-8 py-6 border-b border-zinc-900 sticky top-0 bg-[#0a0a0a]/85 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Link href="/" className="flex items-center font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
            <img src="/affiliatemango_logo.png" alt="AffiliateMango" className="w-16 h-16 md:w-20 md:h-20 object-contain scale-[1.5] -my-6 -ml-4 -mr-2" />
            <div>Affiliate<span className="text-orange-500">Mango</span></div>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className={`${pathname === '/' ? 'text-orange-400' : 'text-zinc-400'} hover:text-orange-400 transition-colors`}>Home</Link>
            <Link href="/features" className={`${pathname === '/features' ? 'text-orange-400' : 'text-zinc-400'} hover:text-orange-400 transition-colors`}>Features</Link>
            <Link href="/docs/api" className={`${pathname === '/docs/api' ? 'text-orange-400' : 'text-zinc-400'} hover:text-orange-400 transition-colors`}>API & Docs</Link>
            <Link href="/pricing" className={`${pathname === '/pricing' ? 'text-orange-400' : 'text-zinc-400'} hover:text-orange-400 transition-colors`}>Pricing</Link>
            <Link href="/contact" className={`${pathname === '/contact' ? 'text-orange-400' : 'text-zinc-400'} hover:text-orange-400 transition-colors`}>Contact</Link>
            <a href="https://partners.cleverpoly.store/login" className="bg-white/10 hover:bg-white/20 transition-all px-4 py-2 rounded-lg">Sign In</a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[88px] bg-[#0a0a0a]/95 backdrop-blur-md z-40 md:hidden overflow-y-auto border-t border-zinc-900 border-x-0 border-b-0">
          <div className="flex flex-col p-6 gap-6 text-lg font-medium shadow-2xl h-full">
            <Link href="/" onClick={() => setIsOpen(false)} className={`${pathname === '/' ? 'text-orange-400' : 'text-zinc-300'} hover:text-orange-400 transition-colors border-b border-zinc-900/50 pb-4`}>Home</Link>
            <Link href="/features" onClick={() => setIsOpen(false)} className={`${pathname === '/features' ? 'text-orange-400' : 'text-zinc-300'} hover:text-orange-400 transition-colors border-b border-zinc-900/50 pb-4`}>Features</Link>
            <Link href="/docs/api" onClick={() => setIsOpen(false)} className={`${pathname === '/docs/api' ? 'text-orange-400' : 'text-zinc-300'} hover:text-orange-400 transition-colors border-b border-zinc-900/50 pb-4`}>API & Docs</Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className={`${pathname === '/pricing' ? 'text-orange-400' : 'text-zinc-300'} hover:text-orange-400 transition-colors border-b border-zinc-900/50 pb-4`}>Pricing</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className={`${pathname === '/contact' ? 'text-orange-400' : 'text-zinc-300'} hover:text-orange-400 transition-colors border-b border-zinc-900/50 pb-4`}>Contact</Link>
            <a href="https://partners.cleverpoly.store/login" className="bg-orange-500 hover:bg-orange-400 text-white text-center transition-all px-4 py-3 rounded-xl mt-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">Sign In to Dashboard</a>
          </div>
        </div>
      )}
    </>
  );
}
