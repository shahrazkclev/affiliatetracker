"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface AdminSearchBarProps {
    initialQuery?: string;
    placeholder?: string;
    accentColor?: string;
}

export function AdminSearchBar({
    initialQuery = "",
    placeholder = "Search...",
    accentColor = "orange",
}: AdminSearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [isPending, startTransition] = useTransition();

    // Prefetch the base (no-query) URL as soon as the component mounts so
    // that clearing the search field is served instantly from the router cache.
    const prefetchedRef = useRef(false);
    useEffect(() => {
        if (!prefetchedRef.current) {
            // Build the URL without `?q=` so Next.js pre-warms it in its cache
            const baseParams = new URLSearchParams(searchParams.toString());
            baseParams.delete("q");
            router.prefetch(`${pathname}?${baseParams.toString()}`);
            prefetchedRef.current = true;
        }
    }, [pathname, router, searchParams]);

    const updateSearch = useDebouncedCallback((value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("q", value);
                params.set("page", "1");
            } else {
                params.delete("q");
                // Remove page reset when clearing so we land on natural state
            }
            router.push(`${pathname}?${params.toString()}`);
        });
    }, 350);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            updateSearch(e.target.value);
        },
        [updateSearch]
    );

    const handleClear = useCallback(() => {
        setQuery("");
        // Cancel any pending debounced search call first
        updateSearch.cancel();

        // Navigate immediately (no debounce delay) so clear feels instant.
        // Next.js router cache already has this URL from the prefetch above.
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("q");
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [updateSearch, searchParams, pathname, router]);

    // Accent ring/border classes
    const ringClass =
        {
            orange: "focus-visible:ring-orange-500/50",
            emerald: "focus-visible:ring-emerald-500/50",
            indigo: "focus-visible:ring-indigo-500/50",
            amber: "focus-visible:ring-amber-500/50",
            zinc: "focus-visible:ring-zinc-500/50",
        }[accentColor] ?? "focus-visible:ring-orange-500/50";

    const activeClass =
        {
            orange: "border-orange-500/40 shadow-[0_0_10px_rgba(251,146,60,0.12)]",
            emerald: "border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.12)]",
            indigo: "border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.12)]",
            amber: "border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.12)]",
            zinc: "border-zinc-500/40 shadow-[0_0_10px_rgba(161,161,170,0.12)]",
        }[accentColor] ?? "border-orange-500/40";

    const iconActiveClass =
        {
            orange: "text-orange-400",
            emerald: "text-emerald-400",
            indigo: "text-indigo-400",
            amber: "text-amber-400",
            zinc: "text-zinc-400",
        }[accentColor] ?? "text-orange-400";

    return (
        <div className="flex flex-col gap-1 w-full md:w-[320px]">
            <div className="relative">
                <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 ${
                        query ? iconActiveClass : "text-zinc-500"
                    } ${isPending ? "animate-pulse" : ""}`}
                />
                <Input
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    className={`pl-10 pr-8 h-9 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 ${ringClass} focus-visible:ring-1 rounded-lg text-sm transition-all duration-300 ${
                        query ? activeClass : "border-zinc-800"
                    }`}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs leading-none"
                    >
                        ✕
                    </button>
                )}
            </div>
            {query && (
                <p className="text-xs text-zinc-500 px-1">
                    {isPending ? (
                        <span className={`${iconActiveClass} animate-pulse`}>Searching database…</span>
                    ) : (
                        <span>
                            Showing DB results for &ldquo;
                            <span className="text-zinc-300 font-medium">{query}</span>
                            &rdquo;
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}
