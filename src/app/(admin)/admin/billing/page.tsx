import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { createSaasCheckoutSession, createSaasPortalSession } from '@/app/actions/saas-billing';
import PricingCard from '@/components/PricingCard';

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Try to safely fetch billing info, ignoring failure if the columns are missing (since the user might not have run the migration yet)
    const { data: org, error } = await supabase
        .from('organizations')
        .select('id, plan_status, trial_ends_at, plan_name, is_free_forever')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        // Suppressing the missing column crash for now to render a graceful stub
        console.error("Billing columns may be missing. Did you run the SQL migration?");
    }

    let affiliateCount = 0;
    if (org?.id) {
        const { count } = await supabase
            .from('affiliates')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);
        affiliateCount = count || 0;
    }

    const isFreeForever = org?.is_free_forever === true;
    const planStatus = org?.plan_status || 'trialing';
    const planName = (org?.plan_name || 'Free Trial').toLowerCase();
    const isPro = planName === 'pro' || isFreeForever;
    const limitMax = isPro ? 'Unlimited' : 100;
    const limitPercentage = typeof limitMax === 'number' ? Math.min((affiliateCount / limitMax) * 100, 100) : 0;
    const isNearingLimit = typeof limitMax === 'number' && limitPercentage >= 90;

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
                                {isFreeForever ? 'Free Forever Plan' : (isActive ? `${org?.plan_name || 'Active'} Plan` : 'Free Trial')}
                            </h2>
                            {isFreeForever ? (
                                <span className="bg-zinc-100 text-zinc-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm shadow-white/20 border border-white">
                                    Free Forever
                                </span>
                            ) : isActive ? (
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
                        
                        {!isActive && !isFreeForever && (
                            <p className="text-zinc-400 text-sm mt-1">
                                {trialExpired 
                                    ? "Your 14-day free trial has expired. Please upgrade to continue using your admin dashboard."
                                    : `Your 14-day free trial ends on ${trialEndsAt.toLocaleDateString()}.`}
                            </p>
                        )}
                        {(isActive || isFreeForever) && (
                            <p className="text-zinc-400 text-sm mt-1">
                                {isFreeForever 
                                    ? 'Your account has been granted unlimited lifetime access to all features.'
                                    : 'Your account is fully active and billed securely via Stripe.'}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0">
                        {isActive && !isFreeForever && (
                            <form action={createSaasPortalSession}>
                                <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-6 rounded-lg transition border border-zinc-700">
                                    Manage Subscription
                                </button>
                            </form>
                        )}
                        {isFreeForever && (
                            <div className="bg-zinc-800/50 text-zinc-300 font-medium py-2 px-6 rounded-lg border border-zinc-700/50 cursor-not-allowed">
                                Lifetime Access
                            </div>
                        )}
                    </div>

                </div>

                {/* Usage Limits Progress Bar */}
                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-300">Active Affiliates Usage</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Calculated based on your current {isPro ? 'Pro' : 'Base'} plan limits.</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-lg font-bold font-mono tracking-tight ${isNearingLimit ? 'text-amber-500' : 'text-zinc-100'}`}>
                                {affiliateCount}
                            </span>
                            <span className="text-zinc-500 text-sm font-mono tracking-tight">
                                {" / "}{typeof limitMax === 'string' ? "∞" : limitMax}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isPro ? 'bg-indigo-500 w-full opacity-50' : (isNearingLimit ? 'bg-amber-500' : 'bg-emerald-500')}`}
                            style={{ width: isPro ? '100%' : (limitPercentage + '%') }}
                        />
                    </div>
                    {isNearingLimit && !isPro && (
                        <p className="text-xs text-amber-500/80 mt-2">
                            You are approaching your Base plan's limit. Upgrade to Pro for unlimited affiliates.
                        </p>
                    )}
                </div>
            </div>

            {!isActive && !isFreeForever && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <PricingCard 
                        title="Base Plan"
                        price="$24"
                        features={[
                            "Up to 100 Active Affiliates",
                            "Standard affiliatemango.com Portal",
                            "Shared SMTP Notifications",
                            "1 Admin Seat",
                            "Automated Stripe Payouts"
                        ]}
                        buttonText="Choose Base"
                        formAction={createSaasCheckoutSession}
                        planValue="base"
                        index={0}
                    />

                    <PricingCard 
                        title="Pro Plan"
                        price="$49"
                        features={[
                            "Unlimited Active Affiliates",
                            "Custom Tenant Domain Mapping",
                            "Dedicated Custom SMTP Routing",
                            "Up to 3 Team Member Seats",
                            "Priority Feature Support"
                        ]}
                        isPopular={true}
                        buttonText="Choose Pro"
                        formAction={createSaasCheckoutSession}
                        planValue="pro"
                        index={1}
                    />
                </div>
            )}
        </div>
    );
}
