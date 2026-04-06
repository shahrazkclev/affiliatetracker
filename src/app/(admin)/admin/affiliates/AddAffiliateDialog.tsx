'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    PlusCircle, UserPlus, Mail, AlertCircle, CheckCircle2, Loader2,
    Copy, Check, Ticket, Tag, RefreshCw, ChevronsUpDown,
} from 'lucide-react';
import { addAffiliateDirectly } from './actions';
import { listStripeCoupons, createStripePromoCode, createStripeCoupon } from '@/app/(admin)/admin/settings/stripe-actions';

const PORTAL_URL = 'https://partners.cleverpoly.store';

// Module-level coupon cache shared with edit dialog
let globalCouponsCache: { id: string; name: string; percent_off: number | null; amount_off: number | null }[] | null = null;

interface Campaign { id: string; name: string; }

export function AddAffiliateDialog({ campaigns }: { campaigns: Campaign[] }) {
    const [tab, setTab] = useState<'add' | 'invite'>('add');
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Stripe promo code state
    const [coupons, setCoupons] = useState<{ id: string; name: string; percent_off: number | null; amount_off: number | null }[]>([]);

    const [couponSearch, setCouponSearch] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [newPromoCode, setNewPromoCode] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState('');
    const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [newCouponName, setNewCouponName] = useState('');
    const [newCouponPercent, setNewCouponPercent] = useState('');
    const [selectedPromoId, setSelectedPromoId] = useState('');
    const [selectedPromoCode, setSelectedPromoCode] = useState('');

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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    // Auto-load coupons when dialog opens
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

    function reset() {
        setError(null);
        setSuccess(false);
        setCopied(false);
        setSelectedPromoId('');
        setSelectedPromoCode('');
        setSelectedCoupon('');
        setNewPromoCode('');
        setCreateMsg(null);
        setShowCouponForm(false);
    }

    function handleTabChange(t: 'add' | 'invite') { setTab(t); reset(); }
    function handleOpenChange(v: boolean) { setOpen(v); if (!v) { reset(); setTab('add'); } }

    async function handleDirectAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        // Inject promo values from state (not form inputs since they're controlled)
        fd.set('stripe_promo_id', selectedPromoId);
        fd.set('stripe_promo_code', selectedPromoCode);
        startTransition(async () => {
            const result = await addAffiliateDirectly(fd);
            if (result?.error) { setError(result.error); return; }
            setSuccess(true);
            setTimeout(() => setOpen(false), 1500);
        });
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(PORTAL_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all duration-200 active:scale-95 shadow-lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Affiliate
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 sm:max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-orange-500" />
                        Add Affiliate
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 mt-4 px-6">
                    {([
                        { id: 'add', label: 'Add Directly', icon: <UserPlus className="w-3.5 h-3.5" /> },
                        { id: 'invite', label: 'Send Invite Link', icon: <Mail className="w-3.5 h-3.5" /> },
                    ] as const).map(t => (
                        <button key={t.id} onClick={() => handleTabChange(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                tab === t.id
                                    ? 'border-orange-500 text-orange-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}>
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                <div className="px-6 pb-6 pt-5">
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2.5 rounded-lg text-sm mb-4">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Affiliate added successfully!
                        </div>
                    )}

                    {/* Tab: Add Directly */}
                    {tab === 'add' && !success && (
                        <form onSubmit={handleDirectAdd} className="space-y-4">
                            <p className="text-xs text-zinc-500 -mt-1">
                                The affiliate will be added as <span className="text-green-400 font-medium">Active</span> immediately. They'll set a password on first login.
                            </p>

                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                                <Input id="name" name="name" placeholder="John Doe" required
                                    className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-zinc-300 text-sm">Email Address</Label>
                                    <Input id="email" name="email" type="email" placeholder="john@example.com" required
                                        className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="referralCode" className="text-zinc-300 text-sm">
                                        Referral Code <span className="text-zinc-500 font-normal">(link ID)</span>
                                    </Label>
                                    <Input id="referralCode" name="referralCode" placeholder="johndoe" required
                                        className="bg-zinc-900 border-zinc-700 text-white focus-visible:ring-orange-500 font-mono" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="campaign" className="text-zinc-300 text-sm">Campaign</Label>
                                <select id="campaign" name="campaign_id"
                                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer appearance-none">
                                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* ── Stripe Promo Code ──────────────────────────────── */}
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
                                                                : 'Select coupon...'}
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
                                                                    onClick={e => e.stopPropagation()}
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
                                                <Input value={newCouponName} onChange={e => setNewCouponName(e.target.value)} placeholder="e.g. 20% Off" className="bg-zinc-900 border-zinc-700 h-7 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-zinc-400 text-[10px] grid">% Discount</Label>
                                                <Input type="number" value={newCouponPercent} onChange={e => setNewCouponPercent(e.target.value)} placeholder="e.g. 20" min="1" max="100" className="bg-zinc-900 border-zinc-700 h-7 text-xs" />
                                            </div>
                                        </div>
                                        <Button type="button" onClick={handleCreateCoupon} disabled={!newCouponName || !newCouponPercent || isCreatingCoupon} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-7 text-xs mb-1">
                                            {isCreatingCoupon ? <Loader2 className="w-3 h-3 animate-spin mx-2" /> : 'Create Stripe Coupon'}
                                        </Button>
                                    </div>
                                )}

                                {createMsg && (
                                    <p className={`text-[10px] px-2 py-1.5 rounded border mt-2 ${createMsg.ok ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' : 'bg-red-950/30 border-red-500/20 text-red-400'}`}>
                                        {createMsg.text}
                                    </p>
                                )}
                            </div>
                            {/* ─────────────────────────────────────────────────────── */}

                            <div className="flex gap-2 pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={isPending} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold">
                                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding…</> : 'Add Affiliate'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Tab: Send Invite */}
                    {tab === 'invite' && (
                        <div className="space-y-4">
                            <p className="text-xs text-zinc-500 -mt-1">
                                Share the sign-up link with anyone you'd like to invite. They'll apply and you can approve them.
                            </p>
                            <div className="flex items-center gap-2">
                                <Input value={PORTAL_URL} readOnly className="bg-zinc-900 border-zinc-700 text-zinc-300 font-mono text-sm focus-visible:ring-orange-500/50" />
                                <Button type="button" onClick={handleCopy} className="shrink-0 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 px-3 h-10">
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-[11px] text-zinc-600 font-mono">
                                Anyone who signs up via this link will appear in your Affiliates list as pending, awaiting approval.
                            </p>
                            <DialogClose asChild>
                                <Button className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">Done</Button>
                            </DialogClose>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
