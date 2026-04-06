"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualReferral } from "@/app/actions/manualReferral";
import { toast } from "sonner";

interface AffiliateOption {
    id: string;
    name: string | null;
    email: string;
}

export function AddManualReferralModal({ affiliates }: { affiliates: AffiliateOption[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [affiliateId, setAffiliateId] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [revenue, setRevenue] = useState("");
    const [commission, setCommission] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!affiliateId || !customerEmail) {
            toast.error("Please fill in the required fields");
            return;
        }

        setLoading(true);
        const data = {
            affiliate_id: affiliateId,
            customer_email: customerEmail,
            revenue: revenue ? parseFloat(revenue) : undefined,
            commission: commission ? parseFloat(commission) : undefined,
        };

        const res = await createManualReferral(data);
        setLoading(false);

        if (res.success) {
            toast.success("Manual referral added successfully");
            setOpen(false);
            setAffiliateId("");
            setCustomerEmail("");
            setRevenue("");
            setCommission("");
        } else {
            toast.error(res.error || "Failed to add manual referral");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-10 bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 font-mono text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Manual Referral
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border border-zinc-800 shadow-2xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-semibold text-zinc-100 flex items-center gap-2 tracking-tight">
                            <Plus className="w-5 h-5 text-amber-500" />
                            Add Custom Referral
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-400">
                            Manually assign a referred customer to an affiliate. Optionally set revenue and commission.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="affiliate" className="text-zinc-300">Select Affiliate <span className="text-amber-500">*</span></Label>
                            <select
                                id="affiliate"
                                required
                                value={affiliateId}
                                onChange={(e) => setAffiliateId(e.target.value)}
                                className="w-full h-10 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                            >
                                <option value="" disabled>-- Choose an Affiliate --</option>
                                {affiliates.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name ? `${a.name} (${a.email})` : a.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="customer_email" className="text-zinc-300">Customer Email <span className="text-amber-500">*</span></Label>
                            <Input
                                id="customer_email"
                                type="email"
                                required
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="customer@example.com"
                                className="bg-zinc-900 border-zinc-700 text-zinc-200 font-mono focus-visible:ring-amber-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="revenue" className="text-zinc-400 text-xs uppercase tracking-wider">Revenue ($)</Label>
                                <Input
                                    id="revenue"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={revenue}
                                    onChange={(e) => setRevenue(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-zinc-900/50 border-zinc-800 text-emerald-400/90 font-mono focus-visible:ring-amber-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="commission" className="text-zinc-400 text-xs uppercase tracking-wider">Commission ($)</Label>
                                <Input
                                    id="commission"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={commission}
                                    onChange={(e) => setCommission(e.target.value)}
                                    placeholder="Optional"
                                    className="bg-zinc-900/50 border-zinc-800 text-amber-500/90 font-mono focus-visible:ring-amber-500"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-8 pt-4 border-t border-zinc-800/50">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setOpen(false)}
                                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            >
                                {loading ? "Adding..." : "Add Referral"}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
