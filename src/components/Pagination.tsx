'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
}

export function Pagination({ totalCount, pageSize, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (totalPages <= 1) return null;

    function goTo(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page));
        router.push(`${pathname}?${params.toString()}`);
    }

    // Build visible page numbers with ellipsis
    function pages(): (number | '...')[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const result: (number | '...')[] = [1];
        if (currentPage > 3) result.push('...');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
            result.push(p);
        }
        if (currentPage < totalPages - 2) result.push('...');
        result.push(totalPages);
        return result;
    }

    const btnBase = 'inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-md text-xs font-medium transition-all';
    const active = `${btnBase} bg-orange-600 text-black font-bold`;
    const inactive = `${btnBase} bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100`;
    const disabled = `${btnBase} bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed`;

    return (
        <div className="flex items-center justify-between px-2 py-3 border-t border-zinc-800/50">
            <span className="text-xs text-zinc-500 font-mono">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalCount} total
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={currentPage <= 1 ? disabled : inactive}
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pages().map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="text-zinc-600 text-xs px-1">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => goTo(p as number)}
                            className={p === currentPage ? active : inactive}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => goTo(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={currentPage >= totalPages ? disabled : inactive}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
