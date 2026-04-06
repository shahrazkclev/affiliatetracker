'use client';

import { useState } from "react";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualCommission } from "@/app/actions/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AddCommissionButton({ affiliates }: { affiliates: any[] }) {
    const [open, setOpen] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function onSubmit(formData: FormData) {
        if (!selectedAffiliateId) {
            toast.error('Please select an affiliate.');
            return;
        }

        const customerEmail = formData.get('customer_email') as string;
        if (!customerEmail) {
            toast.error('Customer email is required.');
            return;
        }
        
        // Add the explicitly selected affiliate ID to FormData
        formData.append('affiliate_id', selectedAffiliateId);

        startTransition(async () => {
            const res = await createManualCommission(formData);
            if (res.success) {
                toast.success('Commission added manually!');
                setOpen(false);
                setSelectedAffiliateId(""); // Reset selection
                router.refresh(); // Ensure the table reloads the newest data
            } else {
                toast.error(res.error || 'Failed to add commission');
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Add Commission
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Manual Commission</DialogTitle>
                    <DialogDescription className="text-sm text-zinc-400">
                        Create a commission record for an affiliate manually.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2 flex flex-col">
                        <Label htmlFor="affiliate_id" className="text-zinc-400">Select Affiliate *</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:text-white font-normal"
                                >
                                    <span className="truncate flex-1 text-left">
                                        {selectedAffiliateId
                                            ? (() => {
                                                  const a = affiliates.find((aff) => aff.id === selectedAffiliateId);
                                                  return a ? `${a.name} (${a.email})` : "Search affiliate...";
                                              })()
                                            : "Search affiliate..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-950 border-zinc-800" 
                                align="start"
                                onWheel={(e) => { e.stopPropagation() }}
                            >
                                <Command className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-500">
                                    <CommandInput placeholder="Search affiliates by name or email..." className="text-zinc-100" />
                                    <CommandList className="max-h-56 overflow-y-auto pointer-events-auto">
                                        <CommandEmpty className="py-6 text-center text-sm text-zinc-500">No affiliate found.</CommandEmpty>
                                        <CommandGroup>
                                            {affiliates.map((a) => (
                                                <CommandItem
                                                    key={a.id}
                                                    value={a.name + " " + a.email}
                                                    onSelect={() => {
                                                        setSelectedAffiliateId(a.id === selectedAffiliateId ? "" : a.id);
                                                        setOpenCombobox(false);
                                                    }}
                                                    className="text-zinc-200 cursor-pointer aria-selected:bg-zinc-800 aria-selected:text-white"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 size-4 text-emerald-500",
                                                            selectedAffiliateId === a.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {a.name} ({a.email})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {/* Hidden input to ensure form submission still acts somewhat normally if needed, though we append manually */}
                        <input type="hidden" name="affiliate_id_fallback" value={selectedAffiliateId} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-zinc-400">Amount (USD) *</Label>
                        <Input 
                            id="amount" 
                            name="amount" 
                            type="number" 
                            step="0.01" 
                            required 
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500" 
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer_email" className="text-zinc-400">Customer Email <span className="text-red-400">*</span></Label>
                        <Input 
                            id="customer_email" 
                            name="customer_email" 
                            type="email"
                            required
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500" 
                            placeholder="customer@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-zinc-400">Status</Label>
                        <Select name="status" defaultValue="pending">
                            <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="pending" className="text-amber-400 focus:bg-zinc-800 focus:text-amber-300">Pending</SelectItem>
                                <SelectItem value="paid" className="text-emerald-400 focus:bg-zinc-800 focus:text-emerald-300">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                            {isPending ? 'Saving...' : 'Save Commission'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
