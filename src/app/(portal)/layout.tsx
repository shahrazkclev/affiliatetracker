import { PortalSidebar } from "@/components/PortalSidebar";

export default function PortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className="dark bg-zinc-950 text-zinc-200 min-h-screen flex relative"
            style={{
                backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
                backgroundSize: '48px 48px'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/80 pointer-events-none z-0" />

            <PortalSidebar />

            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10 w-full max-w-[100vw]">
                <header className="h-16 border-b border-zinc-800/80 flex items-center px-6 justify-between bg-zinc-950/80 backdrop-blur-md z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                        <span className="flex items-center justify-center w-5 h-5 bg-zinc-800 rounded-md shadow-inner border border-zinc-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </span>
                        Affiliate Mode Active
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-950 text-sm font-bold bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                        A
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
