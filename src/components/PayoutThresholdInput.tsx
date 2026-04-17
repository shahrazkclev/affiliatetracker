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
        <div className="flex items-center gap-4">
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold pointer-events-none">$</span>
                <Input
                    type="number"
                    min="0"
                    step="1"
                    className="pl-8 w-36 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono focus-visible:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md transition-all ${
                    value !== initialValue.toString() 
                        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" 
                        : "bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-800"
                }`}
            >
                Update
            </button>
            
            <span className="text-[11px] font-semibold text-zinc-600 uppercase font-sans tracking-wider border-l border-zinc-800 pl-4 ml-1">
                Min Value
            </span>
        </div>
    );
}
