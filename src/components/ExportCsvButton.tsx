'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExportCsvButton({ href, accentColor = 'amber' }: { href: string; accentColor?: string }) {
    const hoverClass =
        accentColor === 'indigo' ? 'hover:text-indigo-400' :
        accentColor === 'amber'  ? 'hover:text-amber-400'  :
        accentColor === 'emerald'? 'hover:text-emerald-400': 'hover:text-amber-400';

    return (
        <a href={href} download>
            <Button
                variant="outline"
                className={`w-full md:w-auto bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 ${hoverClass}`}
            >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
            </Button>
        </a>
    );
}
