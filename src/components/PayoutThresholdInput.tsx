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
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                <Input
                    type="number"
                    min="0"
                    step="1"
                    className="pl-7 w-32 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono focus-visible:ring-amber-500"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleApply}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleApply();
                    }}
                />
            </div>
            <span className="text-xs font-medium text-zinc-600 uppercase font-sans tracking-widest">
                Min Value
            </span>
        </div>
    );
}
