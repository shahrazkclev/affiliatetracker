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
            className={`relative overflow-hidden transition-all duration-300 active:scale-95 flex items-center gap-2 ${className}`}
        >
            <div className={`absolute inset-0 bg-amber-500/20 transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`} />
            {copied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
        </Button>
    );
}
