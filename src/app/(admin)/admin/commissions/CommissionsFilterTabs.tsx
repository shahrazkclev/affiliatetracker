'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

const TABS = [
    { label: 'All', value: 'all', color: 'text-zinc-100' },
    { label: 'Pending', value: 'pending', color: 'text-amber-400' },
    { label: 'Paid', value: 'paid', color: 'text-emerald-400' },
];

export function CommissionsFilterTabs({
    active,
    counts,
}: {
    active: string;
    counts: { all: number; pending: number; paid: number };
}) {
    const router = useRouter();
    const params = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [optimistic, setOptimistic] = useState(active);

    // Keep optimistic in sync with actual URL state on load/back
    useEffect(() => {
        setOptimistic(active);
    }, [active]);

    const activeIdx = TABS.findIndex(t => t.value === optimistic);

    const setFilter = (val: string) => {
        setOptimistic(val);
        const p = new URLSearchParams(params.toString());
        p.delete('page');
        if (val === 'all') p.delete('status');
        else p.set('status', val);
        startTransition(() => {
            router.push(`?${p.toString()}`);
        });
    };

    const countMap: Record<string, number> = {
        all: counts.all,
        pending: counts.pending,
        paid: counts.paid,
    };

    return (
        <div className="relative flex bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-lg shadow-inner w-fit overflow-x-auto hide-scrollbar">
            {/* Sliding pill */}
            <span
                className="absolute top-1 bottom-1 rounded-md bg-zinc-800 shadow-md transition-all duration-300 ease-out"
                style={{
                    width: `calc((100% - 0.5rem) / ${TABS.length} - 0.25rem)`,
                    left: `calc(0.25rem + ${activeIdx} * (100% - 0.5rem) / ${TABS.length} + 0.125rem)`,
                }}
            />
            {TABS.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`relative z-10 px-6 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                        optimistic === tab.value ? tab.color : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    style={{ width: `${100 / TABS.length}%`, minWidth: '7rem' }}
                >
                    {tab.label} ({countMap[tab.value] ?? 0})
                </button>
            ))}
        </div>
    );
}
