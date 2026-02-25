import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MoreVertical, Calendar as CalendarIcon, Zap, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";

export default async function GeneratePayoutsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Default to today if no date provided
    const targetDate = params.date ? new Date(params.date) : new Date();

    // Fetch affiliates that actually have commission
    const { data: affiliates } = await supabase
        .from('affiliates')
        .select('*')
        .gt('total_commission', 0)
        .order('total_commission', { ascending: false });

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Generate Payouts</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-amber-500/50 pl-2 ml-1 mt-1">Batch process outstanding commissions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-200">Execution Window</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm">
                            Process interval defined in <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors hover:underline">campaign config</a>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 rounded-lg w-max relative z-20">
                            <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Target Date</span>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-amber-500/50 transition-all font-mono text-xs shadow-inner">
                                        <CalendarIcon className="w-3.5 h-3.5 mr-2 text-amber-500/70" />
                                        {format(targetDate, "MMM dd, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-zinc-200" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={targetDate}
                                        // onSelect={(date) => { /* Client side navigation would go here to update ?date= */ }}
                                        initialFocus
                                        className="bg-zinc-950 text-zinc-200"
                                        classNames={{
                                            day_selected: "bg-amber-500 text-zinc-950 hover:bg-amber-500 hover:text-zinc-950 focus:bg-amber-500 focus:text-zinc-950",
                                            day_today: "bg-zinc-800 text-zinc-50",
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-200">Threshold Requirement</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm">
                            Nodes must hit this threshold to trigger a payout event.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight flex items-end gap-2">
                            $0 <span className="text-xs font-medium text-zinc-600 mb-1.5 uppercase font-sans tracking-widest">Min Value</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between pt-2 mb-4">
                <a href="#" className="text-amber-400/80 hover:text-amber-400 text-xs font-mono tracking-wide hover:underline transition-colors uppercase">View Docs: Payout Routing</a>
                <Button disabled className="bg-zinc-800/50 text-zinc-500 border border-zinc-800 tracking-wide font-medium shadow-none">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Execute Selected
                </Button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-12"><Checkbox className="border-zinc-600 rounded" /></th>
                            <th className="px-6 py-4">Node Target</th>
                            <th className="px-6 py-4">Routing Email</th>
                            <th className="px-6 py-4">Payload Value</th>
                            <th className="px-6 py-4">Cycle</th>
                            <th className="px-6 py-4 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {affiliates?.length === 0 && (
                            <tr className="bg-zinc-950/30">
                                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
                                    Zero pending payloads detected
                                </td>
                            </tr>
                        )}
                        {affiliates?.map((affiliate) => (
                            <tr key={affiliate.id} className="hover:bg-zinc-800/30 transition-colors duration-200 group relative">
                                <td className="w-0 p-0 absolute left-0 top-0 h-full">
                                    <div className="w-0.5 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                                <td className="px-6 py-4">
                                    <Checkbox className="border-zinc-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 rounded" />
                                </td>
                                <td className="px-6 py-4 text-zinc-200 font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500/40"></div>
                                    {affiliate.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{affiliate.payout_email || '-'}</td>
                                <td className="px-6 py-4 font-mono font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                                    ${Number(affiliate.total_commission).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">2026-01-31</td>
                                <td className="px-6 py-4 text-center">
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors mx-auto active:scale-95">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
