import { Sidebar } from "@/components/Sidebar";
import { MobileSidebarWrapper } from "@/components/MobileSidebarWrapper";
import { PaywallWrapper } from "@/components/PaywallWrapper";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let orgName = "Workspace Settings";
    let isExpired = false;

    if (user?.id) {
        // We select the new billing columns safely. If they don't exist yet, we catch the error gracefully
        const { data: org, error } = await supabase
            .from('organizations')
            .select('name, custom_domain, plan_status, trial_ends_at')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (!error && org) {
            if (org.name) orgName = org.name;
            
            const isBillingActive = org.plan_status === 'active';
            const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : new Date();
            
            if (!isBillingActive && trialEndsAt.getTime() < Date.now()) {
                isExpired = true;
            }
        }
    }

    return (
        <div
            className="dark bg-zinc-950 text-zinc-200 h-screen overflow-hidden flex relative"
            style={{
                backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
                backgroundSize: '48px 48px'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/80 pointer-events-none z-0" />

            <MobileSidebarWrapper>
                <Sidebar />
            </MobileSidebarWrapper>

            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10 min-w-0">
                <header className="h-16 border-b border-zinc-800/80 flex items-center pl-16 md:pl-6 pr-6 justify-between bg-zinc-950/80 backdrop-blur-md z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 font-mono text-xs px-3 py-1.5 rounded-md text-zinc-400 shadow-inner">
                            {orgName}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-950 text-sm font-bold bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)] hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950">
                                C
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">My Account</p>
                                    <p className="text-xs leading-none text-zinc-400 font-normal">
                                        {user?.email || "Admin"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem asChild className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                                <Link href="/admin/settings" className="w-full flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="hover:bg-zinc-900 hover:text-red-400 text-red-500 cursor-pointer">
                                <form action="/auth/signout" method="post" className="w-full">
                                    <button type="submit" className="flex items-center w-full">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
                    <PaywallWrapper isExpired={isExpired}>
                        {children}
                    </PaywallWrapper>
                </div>
            </main>
        </div>
    );
}
