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
                    <div>
                        <p className="text-xl font-bold text-zinc-100">Cleverpoly</p>
                        <div className="text-[10px] uppercase tracking-widest text-amber-500/70 mt-1 font-mono">
                            Affiliate Terminal
                        </div>
                    </div>
                )}
            </div>

            <PortalSidebarNav />
        </aside>
    );
}
