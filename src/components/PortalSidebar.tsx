// Server component — fetches org logo & size from DB, renders sidebar shell.
// Nav links (usePathname) live in PortalSidebarNav (client component).
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { PortalSidebarNav } from "./PortalSidebarNav";

async function getOrgBranding() {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("organizations")
            .select("logo_url, logo_sidebar_height")
            .limit(1)
            .single();
        return data;
    } catch {
        return null;
    }
}

export async function PortalSidebar() {
    const org = await getOrgBranding();
    const logoUrl = org?.logo_url ?? null;
    const logoHeight = Math.min(Math.max(org?.logo_sidebar_height ?? 36, 20), 80);

    return (
        <aside className="w-64 h-screen sticky top-0 bg-zinc-950 text-zinc-400 flex flex-col border-r border-zinc-800 shadow-2xl z-10">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

            {/* Logo — non-clickable, white box for dark-logo readability */}
            <div className="px-5 pt-5 pb-4">
                {logoUrl ? (
                    <div className="inline-flex items-center justify-center bg-white rounded-xl px-3 py-2">
                        <Image
                            src={logoUrl}
                            alt="Brand"
                            width={200}
                            height={logoHeight}
                            style={{ height: logoHeight, width: "auto", maxWidth: 180 }}
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 ml-2">
                        <Image
                            src="/affiliatemango_logo.png"
                            alt="AffiliateMango Logo"
                            width={80}
                            height={80}
                            className="w-14 h-14 object-contain scale-[1.5] -my-6 -ml-3 -mr-2"
                        />
                        <div className="flex flex-col justify-center">
                            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2 group cursor-pointer transition-all duration-300">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 z-10 relative">
                                    AffiliateMango
                                </span>
                            </h1>
                            <div className="text-[9px] uppercase tracking-widest text-amber-500/70 mt-0 font-mono z-10 relative">Affiliate Terminal</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex-1">
                <PortalSidebarNav />
            </div>
        </aside>
    );
}
