import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { createSaasCheckoutSession, createSaasPortalSession } from '@/app/actions/saas-billing';

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Try to safely fetch billing info, ignoring failure if the columns are missing (since the user might not have run the migration yet)
    const { data: org, error } = await supabase
        .from('organizations')
        .select('plan_status, trial_ends_at, plan_name')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        // Suppressing the missing column crash for now to render a graceful stub
        console.error("Billing columns may be missing. Did you run the SQL migration?");
    }

    const planStatus = org?.plan_status || 'trialing';
    const planName = org?.plan_name || 'Free Trial';
    const trialEndsAt = org?.trial_ends_at ? new Date(org.trial_ends_at) : new Date();

    const isTrialing = planStatus === 'trialing';
    const isActive = planStatus === 'active';
    const trialExpired = isTrialing && trialEndsAt.getTime() < Date.now();

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
            <p className="text-zinc-400 mb-8">Manage your AffiliateMango subscription and billing details.</p>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-8 shadow-xl relative mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold text-white capitalize">
                                {isActive ? `${planName} Plan` : 'Free Trial'}
                            </h2>
                            {isActive ? (
                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                                    Active
                                </span>
                            ) : trialExpired ? (
                                <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-medium border border-red-500/20">
                                    Expired
                                </span>
                            ) : (
                                <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                                    Trialing
                                </span>
                            )}
                        </div>
                        
                        {!isActive && (
                            <p className="text-zinc-400 text-sm mt-1">
                                {trialExpired 
                                    ? "Your 14-day free trial has expired. Please upgrade to continue using your admin dashboard."
                                    : `Your 14-day free trial ends on ${trialEndsAt.toLocaleDateString()}.`}
                            </p>
                        )}
                        {isActive && (
                            <p className="text-zinc-400 text-sm mt-1">
                                Your account is fully active and billed securely via Stripe.
                            </p>
                        )}
                    </div>

                    <div className="shrink-0">
                        {isActive && (
                            <form action={createSaasPortalSession}>
                                <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-6 rounded-lg transition border border-zinc-700">
                                    Manage Subscription
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>

            {!isActive && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Base Plan */}
                    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-8 flex flex-col relative transition-all">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">Base Plan</h3>
                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">$49</span>
                                <span className="text-zinc-400 mb-1">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Unlimited Affiliates
                                </li>
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Affiliate Portal Access
                                </li>
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Automated Stripe Payouts
                                </li>
                            </ul>
                        </div>
                        <form action={createSaasCheckoutSession} className="w-full">
                            <input type="hidden" name="plan" value="base" />
                            <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition border border-zinc-700">
                                Choose Base
                            </button>
                        </form>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-zinc-950 border border-brand-orange/50 rounded-xl p-8 flex flex-col relative shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                        <div className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                            Most Popular
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">Pro Plan</h3>
                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">$99</span>
                                <span className="text-zinc-400 mb-1">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Everything in Base
                                </li>
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Custom Tenant Domain
                                </li>
                                <li className="flex items-center text-zinc-300">
                                    <span className="text-emerald-500 mr-3">✓</span> Advanced Portal Customization
                                </li>
                            </ul>
                        </div>
                        <form action={createSaasCheckoutSession} className="w-full">
                            <input type="hidden" name="plan" value="pro" />
                            <button type="submit" className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-medium py-3 px-6 rounded-lg transition shadow-lg shadow-brand-orange/20">
                                Choose Pro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
