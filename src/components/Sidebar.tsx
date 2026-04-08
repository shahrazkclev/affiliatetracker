"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, Users, UserPlus, DollarSign, Megaphone, MonitorPlay, Wallet, History, Settings, Network, GitMerge, CreditCard } from "lucide-react";

const navGroups = [
  {
    title: "Overview",
    items: [
      { icon: Home, label: "Dashboard", href: "/admin" },
      { icon: Users, label: "Partners", href: "/admin/affiliates" },
      { icon: GitMerge, label: "Referrals", href: "/admin/referrals" },
      { icon: UserPlus, label: "Customers", href: "/admin/referred-users" },
    ]
  },

  {
    title: "Payouts",
    items: [
      { icon: Wallet, label: "Generate Payouts", href: "/admin/payouts/generate" },
      { icon: History, label: "Payout History", href: "/admin/payouts/history" },
    ]
  },
  {
    title: "Settings",
    items: [
      { icon: Megaphone, label: "Campaigns", href: "/admin/campaigns" },
      { icon: MonitorPlay, label: "Portal Config", href: "/admin/portal-config" },
      { icon: CreditCard, label: "Subscription", href: "/admin/subscription" },
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    // Exact match or starts with href + "/" — prevents /admin/payouts/* matching both payout items
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-64 h-screen bg-zinc-950 text-zinc-400 flex flex-col border-r border-zinc-800 shadow-2xl z-10 relative">
      <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <Image
            src="/affiliatemango_logo.png"
            alt="AffiliateMango Logo"
            width={80}
            height={80}
            className="w-12 h-12 object-contain -ml-2 mr-1"
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2 group cursor-pointer transition-all duration-300">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 z-10 relative">
                AffiliateMango
              </span>
            </h1>
            <div className="text-[10px] uppercase tracking-widest text-amber-500/70 mt-0 font-mono z-10 relative">Admin Dashboard</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto mt-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 font-mono">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
                    active
                      ? "bg-zinc-900 text-zinc-100 shadow-inner"
                      : "hover:bg-zinc-900/50 hover:text-zinc-200 text-zinc-400"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                  )}
                  <item.icon className={`w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 ${active ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className="relative z-10">{item.label}</span>
                  {!active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/0 via-zinc-800/20 to-zinc-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          System Online
        </div>
      </div>
    </aside>
  );
}
