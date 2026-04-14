"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, DollarSign, Wallet, FileText, Settings, Link as LinkIcon } from "lucide-react";

const navItems = [
    { icon: Home,        label: "Dashboard",       href: "/portal" },
    { icon: LinkIcon,    label: "Tracking Links",  href: "/portal/links" }, // New isolated stats tab
    { icon: DollarSign,  label: "Referrals",       href: "/portal/referrals" }, // Now holds specific commission/sales mapping
    { icon: Users,       label: "Customers",       href: "/portal/customers" }, // Now holds actual customer tracking mapping
    { icon: Wallet,      label: "Payouts",         href: "/portal/payouts" },
    { icon: FileText,    label: "Reports",         href: "/portal/commission-details" },
    { icon: Settings,    label: "Settings",        href: "/portal/settings" },
];

export function PortalSidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2">
            {navItems.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href) && item.href !== "/portal");

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
                            isActive
                                ? "bg-zinc-900/80 text-zinc-100 shadow-inner"
                                : "hover:bg-zinc-900/40 hover:text-zinc-200 text-zinc-400"
                        }`}
                    >
                        {/* Active left-border uses --primary */}
                        {isActive && (
                            <div
                                className="absolute left-0 top-0 w-[3px] h-full rounded-r-full"
                                style={{
                                    background: "var(--primary)",
                                    boxShadow: "0 0 10px var(--primary-50, rgba(245,158,11,0.5))",
                                }}
                            />
                        )}
                        <item.icon
                            className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110`}
                            style={isActive ? { color: "var(--primary)" } : undefined}
                        />
                        <span className="relative z-10">{item.label}</span>

                        {!isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/0 via-zinc-800/20 to-zinc-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
