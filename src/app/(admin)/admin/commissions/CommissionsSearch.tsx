"use client";

import { useState, useTransition, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommissionsActionsCell } from "./CommissionsActionsCell";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface Commission {
    id: string;
    created_at: string;
    amount: number;
    effectiveStatus: string;
    affiliate_id: string;
    customer_email?: string;
    affiliate?: {
        name?: string;
        email?: string;
        campaign?: { name?: string };
    };
}

interface Props {
    commissions: Commission[];
    filterBar: React.ReactNode;
    initialQuery?: string;
}

export function CommissionsTable({ commissions, filterBar, initialQuery = "" }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [isPending, startTransition] = useTransition();

    // Debounce URL update → triggers server re-fetch with DB query
    const updateSearch = useDebouncedCallback((value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("q", value);
                params.set("page", "1"); // reset to page 1 on new search
            } else {
                params.delete("q");
            }
            router.push(`${pathname}?${params.toString()}`);
        });
    }, 350);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        updateSearch(e.target.value);
    }, [updateSearch]);

    const handleClear = useCallback(() => {
        setQuery("");
        updateSearch("");
    }, [updateSearch]);

    return (
        <>
            {/* Filter + Search Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
                {filterBar}

                <div className="relative w-full md:w-[300px]">
                    <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                            query ? "text-emerald-400" : "text-zinc-500"
                        } ${isPending ? "animate-pulse" : ""}`}
                    />
                    <Input
                        placeholder="Search affiliate, email, campaign..."
                        value={query}
                        onChange={handleChange}
                        className={`pl-10 pr-8 h-9 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded-lg text-sm transition-all duration-300 ${
                            query
                                ? "border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.12)]"
                                : "border-zinc-800"
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
            </div>

            {/* Results hint */}
            {query && (
                <div className="px-1 text-xs text-zinc-500 -mt-2">
                    {isPending ? (
                        <span className="text-emerald-400 animate-pulse">Searching database…</span>
                    ) : (
                        <>
                            Showing{" "}
                            <span className="text-zinc-200 font-semibold">{commissions.length}</span>{" "}
                            result{commissions.length !== 1 ? "s" : ""} from DB for &ldquo;{query}&rdquo;
                        </>
                    )}
                </div>
            )}

            {/* Table */}
            <div className={`bg-zinc-900 border border-zinc-800/80 rounded-xl shadow-2xl relative transition-opacity duration-200 ${isPending ? "opacity-50" : "opacity-100"}`}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 whitespace-nowrap">Affiliate</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                                <th className="px-6 py-4 whitespace-nowrap w-16 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {commissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-zinc-950/30">
                                        {query ? `No commissions match "${query}"` : "No commissions synced yet."}
                                    </td>
                                </tr>
                            )}
                            {commissions.map((comm) => (
                                <tr
                                    key={comm.id}
                                    className="hover:bg-zinc-800/30 transition-colors duration-150 group border-l-2 border-transparent hover:border-emerald-500"
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-zinc-300 text-xs">
                                            {new Date(comm.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "2-digit",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="font-mono text-[10px] text-zinc-600 truncate w-24 mt-0.5" title={comm.id}>
                                            {comm.id.substring(0, 8)}…
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200">{comm.affiliate?.name || "Unknown Affiliate"}</div>
                                        <div className="text-zinc-500 text-xs font-mono truncate w-40">
                                            {comm.affiliate?.campaign?.name
                                                ? `📁 ${comm.affiliate.campaign.name}`
                                                : comm.affiliate?.email || comm.affiliate_id}
                                        </div>
                                        {comm.customer_email && (
                                            <div className="text-zinc-600 text-[10px] font-mono truncate w-40 mt-0.5">
                                                👤 {comm.customer_email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                                comm.effectiveStatus === "paid" || comm.effectiveStatus === "completed"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : comm.effectiveStatus === "void" || comm.effectiveStatus === "denied"
                                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                            }`}
                                        >
                                            {comm.effectiveStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                        <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]">
                                            ${Number(comm.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center cursor-pointer">
                                        <CommissionsActionsCell commission={comm} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
