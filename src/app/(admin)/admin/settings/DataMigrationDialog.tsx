"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Loader2, Key, DatabaseBackup, Info } from "lucide-react";
import { syncCompetitorData } from "./actions";
import { useRouter } from "next/navigation";

export function DataMigrationDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [platform, setPlatform] = useState<string>("promotekit");
    const [apiKey, setApiKey] = useState("");
    const [status, setStatus] = useState<{ type: "idle" | "success" | "error", message?: string }>({ type: "idle" });
    const router = useRouter();

    const handleSync = () => {
        if (!apiKey.trim()) {
            setStatus({ type: "error", message: "API Key is required" });
            return;
        }

        setStatus({ type: "idle" });
        startTransition(async () => {
            const res = await syncCompetitorData(platform, apiKey.trim());
            if (res.success) {
                setStatus({ type: "success", message: "Migration completed successfully!" });
                router.refresh();
                setTimeout(() => setOpen(false), 2000);
            } else {
                setStatus({ type: "error", message: res.error || "Migration failed. Check your API key." });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                setStatus({ type: "idle" });
                setApiKey("");
            }
        }}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto font-bold tracking-wide transition-all shadow-md active:scale-95 bg-amber-600 hover:bg-amber-500 text-zinc-950">
                    <DatabaseBackup className="w-4 h-4 mr-2" />
                    Migrate from Competitor
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-200 shadow-2xl max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Download className="w-5 h-5 text-amber-500" /> Competitor Import
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Select a provider and provide your API Key to automatically pull historical campaigns, affiliates, and referrals into your workspace.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Target Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                <SelectValue placeholder="Select platform..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                <SelectItem value="promotekit">PromoteKit</SelectItem>
                                <SelectItem value="tolt">Tolt.io (Coming Soon)</SelectItem>
                                <SelectItem value="rewardful">Rewardful (Coming Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Key className="w-3.5 h-3.5" /> API Key / Secret
                        </Label>
                        <Input
                            type="password"
                            placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-amber-500 font-mono"
                        />
                    </div>

                    {status.type === "error" && (
                        <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-sm text-red-500 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>{status.message}</p>
                        </div>
                    )}
                    {status.type === "success" && (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-sm text-emerald-400 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>{status.message}</p>
                        </div>
                    )}

                    <Button
                        onClick={handleSync}
                        disabled={isPending || !apiKey.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold tracking-wider"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Synchronizing Data...
                            </>
                        ) : (
                            "Commence Migration"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
