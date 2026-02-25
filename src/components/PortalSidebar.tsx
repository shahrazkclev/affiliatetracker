"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, DollarSign, Wallet, FileText, Settings, Network } from "lucide-react";

const navItems = [
    { icon: Home, label: "Network Dashboard", href: "/portal" },
    { icon: Users, label: "Captured Traffic", href: "/portal/referrals" },
    { icon: DollarSign, label: "Commission Output", href: "/portal/commissions" },
    { icon: Wallet, label: "Wallet & Payouts", href: "/portal/payouts" },
    { icon: FileText, label: "Ledger Details", href: "/portal/commission-details" },
    { icon: Settings, label: "Account Config", href: "/portal/settings" },
];

export function PortalSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen bg-zinc-950 text-zinc-400 flex flex-col border-r border-zinc-800 shadow-2xl z-10 relative">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

            <div className="p-6">
                <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2 group cursor-pointer transition-all duration-300">
                    <Network className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform duration-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                        Cleverpoly
                    </span>
                </h1>
                <div className="text-[10px] uppercase tracking-widest text-amber-500/70 mt-1 font-mono">Affiliate Terminal</div>
            </div>

            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/portal");

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative group overflow-hidden ${isActive
                                    ? "bg-zinc-900 text-zinc-100 shadow-inner"
                                    : "hover:bg-zinc-900/50 hover:text-zinc-200"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                            )}
                            <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
                            <span className="relative z-10">{item.label}</span>

                            {/* Subtle hover gradient background */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/0 via-zinc-800/20 to-zinc-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    Connection Secured
                </div>
            </div>
        </aside>
    );
}
