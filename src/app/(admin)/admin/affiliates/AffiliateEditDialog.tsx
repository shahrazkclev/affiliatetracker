'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Loader2, RefreshCw, Tag, Ticket, ChevronsUpDown, Check } from 'lucide-react';
import { updateAffiliate } from '@/app/actions/admin';
import { listStripeCoupons, createStripePromoCode, createStripeCoupon } from "@/app/(admin)/admin/settings/stripe-actions";
import { useRouter } from 'next/navigation';

export type EditableAffiliate = {
    id: string;
    name: string;
    email: string;
    payout_email?: string | null;
    referral_code?: string | null;
    ref_code?: string | null;
    notes?: string | null;
    stripe_promo_code?: string | null;
    stripe_promo_id?: string | null;
    campaign_id?: string | null;
};

interface Props {
    affiliate: EditableAffiliate;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaigns?: any[];
}

let globalCouponsCache: { id: string; name: string; percent_off: number | null; amount_off: number | null }[] | null = null;

export function AffiliateEditDialog({ affiliate, open, onOpenChange, campaigns = [] }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stripe promo code state
    const [coupons, setCoupons] = useState<{ id: string; name: string; percent_off: number | null; amount_off: number | null }[]>(globalCouponsCache || []);
    const [couponSearch, setCouponSearch] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Create promo code state
    const [newPromoCode, setNewPromoCode] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState('');
    const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);

    // Create base coupon state
    const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [newCouponName, setNewCouponName] = useState('');
    const [newCouponPercent, setNewCouponPercent] = useState('');

    const [selectedPromoId, setSelectedPromoId] = useState<string>(affiliate.stripe_promo_id || '');
    const [selectedPromoCode, setSelectedPromoCode] = useState<string>(affiliate.stripe_promo_code || '');

    const filteredCoupons = coupons.filter(c =>
        c.name.toLowerCase().includes(couponSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(couponSearch.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadStripeCodes = useCallback(async (forceReload = false) => {
        if (!forceReload && globalCouponsCache) {
            setCoupons(globalCouponsCache);
            return;
        }
        setPromoLoading(true);
        try {
            const couponRes = await listStripeCoupons();
            if (couponRes.success) {
                globalCouponsCache = couponRes.coupons;
                setCoupons(couponRes.coupons);
            } else {
                setCreateMsg({ ok: false, text: couponRes.error || 'Failed to load coupons' });
            }
        } finally {
            setPromoLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            loadStripeCodes();
        }
    }, [open, loadStripeCodes]);

    async function handleCreatePromo() {
        if (!selectedCoupon) { setCreateMsg({ ok: false, text: 'Select a coupon first' }); return; }
        setIsCreatingPromo(true);
        setCreateMsg(null);
        try {
            const res = await createStripePromoCode(selectedCoupon, newPromoCode);
            if (res.success) {
                setCreateMsg({ ok: true, text: `Created: ${res.code}` });
                setNewPromoCode('');
                setSelectedPromoId(res.id!);
                setSelectedPromoCode(res.code!);
            } else {
                setCreateMsg({ ok: false, text: res.error || 'Failed to create' });
            }
        } finally {
            setIsCreatingPromo(false);
        }
    }

    async function handleCreateCoupon() {
        if (!newCouponName || !newCouponPercent) return;
        setIsCreatingCoupon(true);
        setCreateMsg(null);
        try {
            const res = await createStripeCoupon(newCouponName, parseFloat(newCouponPercent));
            if (res.success) {
                setCreateMsg({ ok: true, text: 'Base coupon created!' });
                setNewCouponName('');
                setNewCouponPercent('');
                setShowCouponForm(false);
                await loadStripeCodes(true);
            } else {
                setCreateMsg({ ok: false, text: res.error || 'Failed to create coupon' });
            }
        } finally {
            setIsCreatingCoupon(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await updateAffiliate(affiliate.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                onOpenChange(false);
                router.refresh();
            }
        } catch (e: any) {
            setError(e.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    }

    const refCode = affiliate.referral_code || affiliate.ref_code || '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 max-w-xl max-h-[90vh] overflow-y-auto w-full z-50">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                        <Edit2 className="w-5 h-5 text-orange-500" />
                        Edit Affiliate
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Update all details for <span className="text-zinc-200 font-medium">{affiliate.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-2">
                    <input type="hidden" name="stripe_promo_id" value={selectedPromoId} />
                    <input type="hidden" name="stripe_promo_code" value={selectedPromoCode} />

                    {/* Personal Info */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Personal Info</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="af-name" className="text-zinc-300 text-xs">Full Name</Label>
                            <Input
                                id="af-name"
                                name="name"
                                defaultValue={affiliate.name}
                                required
                                className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500 h-9 text-sm"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="af-email" className="text-zinc-300 text-xs">Email Address</Label>
                            <Input
                                id="af-email"
                                name="email"
                                type="email"
                                defaultValue={affiliate.email}
                                required
                                className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500 h-9 text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="af-payout" className="text-zinc-300 text-xs">Payout Email</Label>
                            <Input
                                id="af-payout"
                                name="payout_email"
                                type="email"
                                defaultValue={affiliate.payout_email || ''}
                                placeholder={affiliate.email}
                                className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500 h-9 text-sm"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="af-refcode" className="text-zinc-300 text-xs">Referral Code</Label>
                            <Input
                                id="af-refcode"
                                name="referral_code"
                                defaultValue={refCode}
                                className="bg-zinc-900 border-zinc-700 text-orange-400 font-mono focus-visible:ring-orange-500 h-9 text-sm"
                                placeholder="e.g. JOHN20"
                            />
                        </div>
                    </div>

                    {/* Campaign */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="af-campaign" className="text-zinc-300 text-xs">Assigned Campaign</Label>
                        <select id="af-campaign" name="campaign_id" defaultValue={affiliate.campaign_id || ''} className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer">
                            <option value="">No campaign</option>
                            {campaigns?.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                    </div>

                    {/* Stripe Promo Code */}
                    <div className="space-y-2 border border-zinc-800 rounded-lg p-3 bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Stripe Promo Code</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => loadStripeCodes(true)}
                                disabled={promoLoading}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-800 hover:bg-indigo-900/50 border border-zinc-700 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-300 transition-all"
                            >
                                {promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                {promoLoading ? 'Loading...' : coupons.length ? 'Reload Coupons' : 'Load Coupons'}
                            </button>
                        </div>

                        {selectedPromoCode && (
                            <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/20 rounded-lg px-3 py-2 mb-2">
                                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-xs font-mono text-indigo-300">Attached: <strong>{selectedPromoCode}</strong></span>
                                <button type="button" onClick={() => { setSelectedPromoId(''); setSelectedPromoCode(''); }} className="ml-auto text-zinc-500 hover:text-red-400 transition-colors text-[10px]">✕ Remove</button>
                            </div>
                        )}

                        {!showCouponForm ? (
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1.5 flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-400 text-xs">Base Coupon</Label>
                                        <button type="button" onClick={() => setShowCouponForm(true)} className="text-[10px] text-indigo-400 hover:text-indigo-300">+ Create new base coupon</button>
                                    </div>
                                    {coupons.length === 0 ? (
                                        <p className="text-zinc-600 text-[10px]">No coupons loaded. Click 'Load Coupons' or create one.</p>
                                    ) : (
                                        <div className="relative" ref={dropdownRef}>
                                            <div
                                                className="flex min-h-8 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-white cursor-pointer hover:bg-zinc-900 transition-colors"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            >
                                                <span className="truncate pr-2">
                                                    {selectedCoupon
                                                        ? coupons.find(c => c.id === selectedCoupon)?.name || selectedCoupon
                                                        : "Select coupon..."}
                                                </span>
                                                <ChevronsUpDown className="h-3 w-3 text-zinc-500 shrink-0" />
                                            </div>
                                            {isDropdownOpen && (
                                                <div className="absolute top-full left-0 z-[100] mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                                                    <div className="p-2 border-b border-zinc-800 bg-zinc-900">
                                                        <Input
                                                            value={couponSearch}
                                                            onChange={e => setCouponSearch(e.target.value)}
                                                            placeholder="Search coupons by name or ID..."
                                                            className="bg-zinc-950 border-zinc-700 text-indigo-300 h-8 text-xs focus-visible:ring-indigo-500/50"
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto overscroll-contain">
                                                        {filteredCoupons.length === 0 ? (
                                                            <div className="p-3 text-center text-xs text-zinc-500">No matching coupons found.</div>
                                                        ) : (
                                                            filteredCoupons.map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-indigo-900/40 text-zinc-300 transition-colors ${selectedCoupon === c.id ? 'bg-indigo-900/20 text-white font-medium' : ''}`}
                                                                    onClick={() => {
                                                                        setSelectedCoupon(c.id);
                                                                        setIsDropdownOpen(false);
                                                                        setCouponSearch('');
                                                                    }}
                                                                >
                                                                    <span className="truncate pr-2">{c.name} — {c.percent_off ? `${c.percent_off}% off` : `$${((c.amount_off || 0) / 100).toFixed(2)} off`} (ID: {c.id})</span>
                                                                    {selectedCoupon === c.id && <Check className="h-3 w-3 text-indigo-400 shrink-0" />}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-zinc-400 text-xs">Unique Code for this Affiliate</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newPromoCode}
                                            onChange={e => setNewPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                            placeholder="e.g. SUMMER25"
                                            className="bg-zinc-950 border-zinc-700 text-indigo-300 font-mono h-8 text-xs focus-visible:ring-indigo-500/50 uppercase"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleCreatePromo}
                                            disabled={!selectedCoupon || !newPromoCode || isCreatingPromo}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs shrink-0 px-3"
                                        >
                                            {isCreatingPromo ? <Loader2 className="w-3 h-3 animate-spin mx-2" /> : 'Create Promo Code'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2 pb-1 px-3 bg-zinc-950/50 border border-zinc-700 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-zinc-300">Create Base Coupon</span>
                                    <button type="button" onClick={() => setShowCouponForm(false)} className="text-zinc-500 hover:text-zinc-300 text-[10px]">Cancel</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400 text-[10px] grid">Coupon Name</Label>
                                        <Input
                                            value={newCouponName}
                                            onChange={e => setNewCouponName(e.target.value)}
                                            placeholder="e.g. 20% Off"
                                            className="bg-zinc-900 border-zinc-700 h-7 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400 text-[10px] grid">% Discount</Label>
                                        <Input
                                            type="number"
                                            value={newCouponPercent}
                                            onChange={e => setNewCouponPercent(e.target.value)}
                                            placeholder="e.g. 20"
                                            min="1" max="100"
                                            className="bg-zinc-900 border-zinc-700 h-7 text-xs"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleCreateCoupon}
                                    disabled={!newCouponName || !newCouponPercent || isCreatingCoupon}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-7 text-xs mb-1"
                                >
                                    {isCreatingCoupon ? <Loader2 className="w-3 h-3 animate-spin mx-2" /> : 'Create Stripe Coupon'}
                                </Button>
                            </div>
                        )}

                        {createMsg && (
                            <p className={`text-[10px] px-2 py-1.5 rounded border mt-2 ${createMsg.ok
                                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-950/30 border-red-500/20 text-red-400'
                                }`}>{createMsg.text}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="af-notes" className="text-zinc-300 text-xs">Internal Notes</Label>
                        <textarea
                            id="af-notes"
                            name="notes"
                            defaultValue={affiliate.notes || ''}
                            rows={2}
                            placeholder="Optional internal notes about this affiliate..."
                            className="flex w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                        >
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
