import { PortalSidebar } from "@/components/PortalSidebar";
import { MobileSidebarWrapper } from "@/components/MobileSidebarWrapper";
import { ProfileMenu } from "@/components/ProfileMenu";
import { createClient } from "@/utils/supabase/server";

async function getOrgBranding() {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("organizations")
            .select("primary_color, theme")
            .limit(1)
            .single();
        return data;
    } catch {
        return null;
    }
}

export default async function PortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const branding = await getOrgBranding();
    const primaryColor = branding?.primary_color ?? "#f59e0b";
    const isLight = branding?.theme === "light";

    // Build CSS custom properties injected into the page so every
    // component in the portal can use var(--primary) to get the brand color.
    const cssVars = `
        :root {
            --primary: ${primaryColor};
            --primary-rgb: ${hexToRgb(primaryColor)};
            --primary-10: ${primaryColor}1a;
            --primary-20: ${primaryColor}33;
            --primary-50: ${primaryColor}80;
        }
    `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssVars }} />
            <div
                className={`${isLight ? "" : "dark"} ${isLight ? "bg-white text-zinc-800" : "bg-zinc-950 text-zinc-200"} min-h-screen flex relative`}
                style={isLight ? {} : {
                    backgroundImage: "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            >
                {!isLight && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/80 pointer-events-none z-0" />
                )}

                <MobileSidebarWrapper>
                    <PortalSidebar />
                </MobileSidebarWrapper>

                <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10 w-full max-w-[100vw]">
                    <header
                        className={`h-16 border-b flex items-center pl-16 md:pl-6 pr-6 justify-between backdrop-blur-md z-10 shadow-sm shrink-0 ${
                            isLight
                                ? "border-zinc-200 bg-white/90"
                                : "border-zinc-800/80 bg-zinc-950/80"
                        }`}
                    >
                        <div className={`flex items-center gap-2 text-sm font-medium ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                            <span
                                className={`flex items-center justify-center w-5 h-5 rounded-md shadow-inner border ${
                                    isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-zinc-700"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </span>
                            Affiliate Mode Active
                        </div>
                        <ProfileMenu />
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}

/** Convert #rrggbb → "r, g, b" for use in rgba() */
function hexToRgb(hex: string): string {
    const n = parseInt(hex.replace("#", ""), 16);
    if (isNaN(n)) return "245, 158, 11";
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
