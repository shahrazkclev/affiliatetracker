"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { syncPromoteKitData } from "./actions";
import { useRouter } from "next/navigation";

export function SyncButton() {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const router = useRouter();

    const handleSync = () => {
        startTransition(async () => {
            const res = await syncPromoteKitData();
            if (res.success) {
                setStatus("success");
                router.refresh();
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setTimeout(() => setStatus("idle"), 4000);
            }
        });
    };

    return (
        <Button
            onClick={handleSync}
            disabled={isPending}
            className={`w-full sm:w-auto font-bold tracking-wide transition-all shadow-md active:scale-95 ${status === "success" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                    status === "error" ? "bg-red-600 hover:bg-red-500 text-white" :
                        "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-orange-500/50"
                }`}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Download className="w-4 h-4 mr-2" />
            )}
            {isPending ? "Syncing Platform Data..." :
                status === "success" ? "Sync Complete!" :
                    status === "error" ? "Sync Failed" :
                        "Pull PromoteKit Data"}
        </Button>
    );
}
