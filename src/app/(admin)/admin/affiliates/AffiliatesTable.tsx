'use client';

import { ReactNode, useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AffiliateActionsCell } from "./AffiliateActionsCell";


const STATUS_TABS = [
    { label: 'Active', value: 'active', color: 'text-orange-400' },
    { label: 'Pending', value: 'pending', color: 'text-yellow-400' },
    { label: 'Banned', value: 'banned', color: 'text-red-400' },
];

type Affiliate = {
    id: string;
    name: string;
    email: string;
    status: string;
    referral_code: string | null;
    ref_code: string | null;
    clicks: number | null;
    total_commission: number | null;
    total_revenue: number | null;
    created_at: string;
    campaign_id: string | null;
    payout_email: string | null;
    stripe_promo_code: string | null;
    stripe_promo_id: string | null;
    promo_custom_word: string | null;
    notes: string | null;
    campaign?: { name: string } | null;
};

export function AffiliatesTable({
    affiliates,
    campaigns,
    activeStatus,
    counts,
    totalCount,
    currentPage,
    pageSize,
    searchBar,
}: {
    affiliates: Affiliate[];
    campaigns: { id: string; name: string }[];
    activeStatus: string;
    counts: { active: number; pending: number; banned: number };
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchBar?: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Optimistic: switch tab visually immediately, don't wait for server
    const [optimisticStatus, setOptimisticStatus] = useState(activeStatus);

    function setStatus(value: string) {
        setOptimisticStatus(value); // instant visual switch
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', value);
        params.set('page', '1');
        params.delete('q');
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    function setPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(p));
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    // Keep optimistic in sync if parent re-renders with a different status
    // (e.g. browser back/forward)
    const displayStatus = optimisticStatus;

    // ── Cache initial (unfiltered) data per status in sessionStorage ──────────
    // Written whenever we're showing data with no active search query.
    useEffect(() => {
        const hasQuery = searchParams.has('q');
        if (!hasQuery && !isPending && affiliates.length > 0) {
            try {
                sessionStorage.setItem(
                    `aff-cache-${activeStatus}`,
                    JSON.stringify(affiliates)
                );
            } catch {}
        }
    }, [affiliates, activeStatus, isPending, searchParams]);

    // Detect "clearing search": pending transition while current URL still has ?q=
    const isClearingSearch = isPending && searchParams.has('q');

    // If clearing, restore cached data immediately — no skeleton, no wait
    const cachedAffiliates = useMemo<Affiliate[] | null>(() => {
        if (!isClearingSearch) return null;
        try {
            const raw = sessionStorage.getItem(`aff-cache-${displayStatus}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, [isClearingSearch, displayStatus]);

    // The rows to actually render
    const displayAffiliates = cachedAffiliates ?? affiliates;
    // Skip skeleton when we have cached data to show immediately
    const showSkeleton = isPending && !cachedAffiliates && counts[displayStatus as keyof typeof counts] > 0;
    const showInstantEmpty = isPending && !cachedAffiliates && counts[displayStatus as keyof typeof counts] === 0;

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));


    return (
        <div className="space-y-4">
            {/* Status tabs — animated sliding pill */}
            <div className="relative flex bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-lg w-fit shadow-inner overflow-x-auto hide-scrollbar">
                {/* Sliding pill — driven by optimistic state = instant */}
                <span
                    className="absolute top-1 bottom-1 rounded-md bg-zinc-800 shadow-md transition-all duration-300 ease-out"
                    style={{
                        width: `calc((100% - 0.5rem) / ${STATUS_TABS.length} - 0.25rem)`,
                        left: `calc(0.25rem + ${STATUS_TABS.findIndex(t => t.value === displayStatus)} * (100% - 0.5rem) / ${STATUS_TABS.length} + 0.125rem)`,
                    }}
                />

                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setStatus(tab.value)}
                        className={`relative z-10 px-6 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${

                            displayStatus === tab.value ? tab.color : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{ width: `${100 / STATUS_TABS.length}%`, minWidth: '7rem' }}
                    >
                        {tab.label} ({counts[tab.value as keyof typeof counts]})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl">
                {searchBar}
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-visible shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4">Affiliate</th>
                                <th className="px-6 py-4">Ref Code</th>
                                <th className="px-6 py-4">Campaign</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">Commission</th>
                                <th className="px-6 py-4 text-center">Clicks</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {/* ── Instant empty for 0-count tab switches ── */}
                            {showInstantEmpty && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest animate-in fade-in duration-200">
                                        No {displayStatus} affiliates found.
                                    </td>
                                </tr>
                            )}
                            {/* ── Shimmer skeleton for tab switches with data ── */}
                            {showSkeleton && (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                                                <div className="space-y-1.5">
                                                    <div className="h-3 bg-zinc-800 rounded w-28" />
                                                    <div className="h-2 bg-zinc-800/60 rounded w-40" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-3 bg-zinc-800 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-3 bg-zinc-800 rounded w-20" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-3 bg-zinc-800 rounded w-16 ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-3 bg-zinc-800 rounded w-14 ml-auto" /></td>
                                        <td className="px-6 py-4 text-center"><div className="h-3 bg-zinc-800 rounded w-8 mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-3 bg-zinc-800 rounded w-20" /></td>
                                        <td className="px-6 py-4" />
                                    </tr>
                                ))
                            )}
                            {/* ── Real data (also renders cached data instantly when clearing search) ── */}
                            {!showSkeleton && !showInstantEmpty && displayAffiliates.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                                        No {activeStatus} affiliates found.
                                    </td>
                                </tr>
                            )}
                            {!showSkeleton && !showInstantEmpty && displayAffiliates.map(affiliate => (

                                <tr key={affiliate.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group border-l-2 border-transparent hover:border-orange-500">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                affiliate.status === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]' :
                                                affiliate.status === 'pending' ? 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]' :
                                                'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                                            }`} />
                                            {affiliate.name}
                                        </div>
                                        <div className="text-zinc-500 font-mono text-xs mt-0.5 ml-4">{affiliate.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-orange-400">
                                            {affiliate.referral_code || affiliate.ref_code || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {affiliate.campaign?.name || <span className="text-zinc-600">No campaign</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-sm text-zinc-300">
                                        ${Number(affiliate.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                        ${Number(affiliate.total_commission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-zinc-400">
                                        {affiliate.clicks || 0}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                        {new Date(affiliate.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <AffiliateActionsCell
                                            affiliate={affiliate}
                                            campaigns={campaigns}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
                        <span className="text-xs text-zinc-500 font-mono">
                            Page {currentPage} of {totalPages} · {totalCount} total
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage <= 1}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                                .map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-md text-xs font-medium transition-all ${
                                            p === currentPage
                                                ? 'bg-orange-600 text-black font-bold'
                                                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            <button
                                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage >= totalPages}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
