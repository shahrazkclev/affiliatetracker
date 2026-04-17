"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function PayoutThresholdInput({ initialValue = 0 }: { initialValue?: number }) {
    const [value, setValue] = useState(initialValue.toString());
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            params.set("minAmount", num.toString());
        } else {
            params.delete("minAmount");
            setValue("0");
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-500 font-medium text-sm pointer-events-none">$</span>
                <Input
                    type="number"
                    min="0"
                    step="1"
                    className="pl-7 w-28 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-sm focus-visible:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md h-10"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleApply();
                    }}
                />
            </div>
            
            <button
                onClick={handleApply}
                disabled={value === initialValue.toString()}
                className={`text-xs font-bold tracking-wide px-4 h-10 rounded-md transition-all flex items-center justify-center ${
                    value !== initialValue.toString() 
                        ? "bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-md shadow-amber-500/20" 
                        : "bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-800/50"
                }`}
            >
                UPDATE
            </button>
            
            <div className="h-6 w-px bg-zinc-800 mx-1"></div>
            
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">
                Min Threshold
            </span>
        </div>
    );
}
