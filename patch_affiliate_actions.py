import sys

with open("src/app/(admin)/admin/affiliates/AffiliateActionsCell.tsx", "r") as f:
    content = f.read()

# 1. Add state variables for promo code
state_str = """    const [newCampaignId, setNewCampaignId] = useState('');
    const [newCampaignRefCode, setNewCampaignRefCode] = useState('');
    const [addCampaignError, setAddCampaignError] = useState<string | null>(null);"""

new_state_str = """    const [newCampaignId, setNewCampaignId] = useState('');
    const [newCampaignRefCode, setNewCampaignRefCode] = useState('');
    const [newCampaignPromoId, setNewCampaignPromoId] = useState('');
    const [newCampaignPromoCode, setNewCampaignPromoCode] = useState('');
    const [addCampaignError, setAddCampaignError] = useState<string | null>(null);
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [promoLoading, setPromoLoading] = useState(false);

    const loadStripeCodes = useCallback(async (force = false) => {
        if (!force && globalCouponsCache) {
            setPromoCodes(globalCouponsCache);
            return;
        }
        if (globalCouponsFetching) return;
        globalCouponsFetching = true;
        setPromoLoading(true);
        const { getStripePromoCodes } = await import('@/app/actions/admin');
        const res = await getStripePromoCodes();
        if (res.success) {
            globalCouponsCache = res.codes || [];
            setPromoCodes(globalCouponsCache);
        }
        setPromoLoading(false);
        globalCouponsFetching = false;
    }, []);

    useEffect(() => {
        if (isAddCampaignOpen) loadStripeCodes();
    }, [isAddCampaignOpen, loadStripeCodes]);"""

content = content.replace(state_str, new_state_str)

# 2. Add promo code to formData in handleAddCampaign
submit_str = """            formData.append('referralCode', newCampaignRefCode);
            formData.append('campaign_id', newCampaignId);"""

new_submit_str = """            formData.append('referralCode', newCampaignRefCode);
            formData.append('campaign_id', newCampaignId);
            formData.append('stripe_promo_id', newCampaignPromoId);
            formData.append('stripe_promo_code', newCampaignPromoCode);"""

content = content.replace(submit_str, new_submit_str)

# 3. Add UI inside DialogContent
ui_str = """                            <p className="text-[10px] text-zinc-500">Must be totally unique (e.g. {affiliate.name.split(' ')[0].toLowerCase()}_camp2)</p>
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-2">"""

new_ui_str = """                            <p className="text-[10px] text-zinc-500">Must be totally unique (e.g. {affiliate.name.split(' ')[0].toLowerCase()}_camp2)</p>
                        </div>

                        {/* Stripe Promo Code */}
                        <div className="space-y-2 border border-zinc-800 rounded-lg p-3 bg-zinc-900/50 mt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Stripe Promo Code</span>
                                </div>
                                <button type="button" onClick={() => loadStripeCodes(true)} disabled={promoLoading} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-800 hover:bg-indigo-900/50 border border-zinc-700 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-300 transition-all">
                                    {promoLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>} Refresh
                                </button>
                            </div>
                            <select 
                                value={newCampaignPromoId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewCampaignPromoId(val);
                                    if (val) {
                                        const c = promoCodes.find(x => x.id === val);
                                        if (c) setNewCampaignPromoCode(c.code);
                                    } else {
                                        setNewCampaignPromoCode('');
                                    }
                                }}
                                className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-mono text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer mb-2"
                            >
                                <option value="" className="font-sans text-zinc-400">-- None --</option>
                                {promoCodes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} {c.percent_off ? `(${c.percent_off}% OFF)` : c.amount_off ? `(-$${(c.amount_off/100).toFixed(2)})` : ''} - {c.coupon_name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-zinc-500 leading-tight">Must create Promo Codes in Stripe directly or via Add Affiliate modal first.</p>
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-2">"""

content = content.replace(ui_str, new_ui_str)

with open("src/app/(admin)/admin/affiliates/AffiliateActionsCell.tsx", "w") as f:
    f.write(content)

print("Patched successfully")
