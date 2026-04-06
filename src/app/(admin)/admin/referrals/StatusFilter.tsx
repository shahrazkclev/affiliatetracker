'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const TABS = [
    { label: 'All',      value: 'all',      color: 'text-zinc-100' },
    { label: 'Paid',     value: 'paid',     color: 'text-emerald-400' },
    { label: 'Pending',  value: 'pending',  color: 'text-amber-400' },
];

export function StatusFilter({
    activeStatus,
    counts,
}: {
    activeStatus: string;
    counts: { all: number; paid: number; pending: number };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [optimistic, setOptimistic] = useState(activeStatus);

    // Keep optimistic in sync with actual URL state on load/back
    useEffect(() => {
        setOptimistic(activeStatus);
    }, [activeStatus]);

    const activeIdx = TABS.findIndex(t => t.value === optimistic);

    const countMap: Record<string, number> = {
        all: counts.all,
        paid: counts.paid,
        pending: counts.pending,
    };

    function handleClick(value: string) {
        setOptimistic(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all') params.delete('status');
        else params.set('status', value);
        params.set('page', '1');
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <div className="relative flex bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-lg w-fit shadow-inner overflow-x-auto hide-scrollbar">
            {/* Sliding pill — driven by optimistic state = instant */}
            <span
                className="absolute top-1 bottom-1 rounded-md bg-zinc-800 shadow-md transition-all duration-300 ease-out pointer-events-none"
                style={{
                    width: `calc((100% - 0.5rem) / ${TABS.length} - 0.25rem)`,
                    left: `calc(0.25rem + ${activeIdx} * (100% - 0.5rem) / ${TABS.length} + 0.125rem)`,
                }}
            />
            {TABS.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => handleClick(tab.value)}
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
