"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, className }: { text: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <Button
            variant="secondary"
            onClick={handleCopy}
            className={`relative overflow-hidden transition-all duration-300 active:scale-95 flex items-center gap-2 ${copied ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 scale-[0.98]' : ''} ${className}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent translate-x-[-100%] transition-transform duration-500 ${copied ? 'translate-x-[100%]' : ''}`} />
            {copied ? <Check className="w-4 h-4 text-amber-400 animate-in zoom-in spin-in-12 duration-300" /> : <Copy className="w-4 h-4 transition-transform group-hover:scale-110" />}
            <span className={copied ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}>
                {copied ? "Copied!" : "Copy Link"}
            </span>
        </Button>
    );
}
