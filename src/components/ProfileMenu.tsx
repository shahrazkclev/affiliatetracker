'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { LogOut, User } from 'lucide-react';

export function ProfileMenu() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const [initial, setInitial] = useState('A');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email) {
                setEmail(user.email);
                setInitial(user.email[0].toUpperCase());
            }
        });
    }, []);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    }

    return (
        <div ref={ref} className="relative">
            {/* Avatar button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-950 text-sm font-bold bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)] hover:shadow-[0_0_16px_rgba(249,115,22,0.55)] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                aria-label="Profile menu"
            >
                {initial}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Email row */}
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-orange-500/10 border border-orange-500/20 shrink-0">
                            <User className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[11px] text-zinc-500 font-medium leading-none mb-0.5">Signed in as</p>
                            <p className="text-xs text-zinc-200 font-medium truncate">{email ?? '…'}</p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
