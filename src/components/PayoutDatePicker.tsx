"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function PayoutDatePicker({ initialDate, isAllTime = false }: { initialDate: Date, isAllTime?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [date, setDate] = React.useState<Date>(initialDate);
    const [open, setOpen] = React.useState(false);

    const handleSelect = (newDate: Date | undefined) => {
        if (!newDate) return;
        setDate(newDate);
        setOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", newDate.toISOString());
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleAllTime = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", "all");
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={`h-8 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-all font-mono text-xs shadow-inner ${isAllTime ? 'text-zinc-500' : 'text-zinc-300 hover:text-white hover:border-amber-500/50'}`}>
                        <CalendarIcon className={`w-3.5 h-3.5 mr-2 ${isAllTime ? 'text-zinc-600' : 'text-amber-500/70'}`} />
                        {isAllTime ? "Custom Date" : format(date, "MMM dd, yyyy")}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-zinc-200" align="start">
                    <Calendar
                        mode="single"
                        selected={isAllTime ? undefined : date}
                    onSelect={handleSelect}
                    initialFocus
                    className="bg-zinc-950 text-zinc-200"
                    classNames={{
                        day_selected: "bg-amber-500 text-zinc-950 hover:bg-amber-500 hover:text-zinc-950 focus:bg-amber-500 focus:text-zinc-950",
                        day_today: "bg-zinc-800 text-zinc-50",
                    }}
                />
                </PopoverContent>
            </Popover>

            <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
            
            <Button 
                variant="ghost" 
                onClick={handleAllTime}
                className={`h-8 px-3 transition-all font-mono text-xs ${isAllTime ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'}`}
            >
                <Infinity className="w-4 h-4 mr-1.5" />
                All-Time
            </Button>
        </div>
    );
}
