export default function AdminLoading() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="space-y-2">
                    <div className="h-6 w-40 bg-zinc-800 rounded" />
                    <div className="h-3 w-28 bg-zinc-900 rounded" />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-6 space-y-3">
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                        <div className="h-8 w-32 bg-zinc-800 rounded" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden">
                <div className="border-b border-zinc-800/80 px-6 py-4 flex gap-4">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-3 bg-zinc-800 rounded" style={{ width: `${60 + i * 15}px` }} />
                    ))}
                </div>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="border-b border-zinc-800/30 px-6 py-4 flex gap-8 items-center">
                        <div className="space-y-1.5 flex-1">
                            <div className="h-3 w-32 bg-zinc-800 rounded" />
                            <div className="h-2.5 w-48 bg-zinc-900 rounded" />
                        </div>
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                        <div className="h-3 w-24 bg-zinc-800 rounded" />
                        <div className="h-3 w-16 bg-zinc-800 rounded" />
                        <div className="h-3 w-8 bg-zinc-800 rounded ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}
