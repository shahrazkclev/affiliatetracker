import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createSaasCheckoutSession } from '@/app/actions/saas-billing';
import PricingCard from '@/components/PricingCard';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default async function RegisterBillingPage() {
    const supabase = await createClient();
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    let orgId = null;

    const { data: teamMembership } = await admin.from('team_members').select('org_id').eq('user_id', user.id).maybeSingle();
    if (teamMembership?.org_id) {
        orgId = teamMembership.org_id;
    } else {
        const { data: orgLookup } = await admin.from('organizations').select('id').eq('owner_id', user.id).maybeSingle();
        if (orgLookup?.id) orgId = orgLookup.id;
    }

    if (!orgId) redirect('/login');

    const { data: org } = await admin.from('organizations').select('plan_status, trial_ends_at, is_free_forever, stripe_subscription_id').eq('id', orgId).single();

    // If they already have an active sub or are free forever, push them to dashboard
    if (org?.is_free_forever || org?.plan_status === 'active' || org?.stripe_subscription_id) {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen flex bg-[#0e0e10] text-zinc-100 font-sans">
            {/* Left Panel */}
            <div className="hidden lg:flex w-[45%] bg-[#0a0a0a] border-r border-zinc-800 flex-col px-12 py-16 justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,88,12,0.15)_0%,transparent_50%)] pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-16 group">
                        <img 
                            src="/affiliatemango_logo.png" 
                            alt="AffiliateMango Logo" 
                            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform"
                        />
                        <span className="font-extrabold text-2xl tracking-tighter">Affiliate<span className="text-orange-500">Mango</span></span>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-6">
                        Activate your trial.
                    </h1>
                    <p className="text-zinc-400 text-lg mb-12">
                        You won't be charged today. Select a plan to start your 14-day free trial.
                    </p>

                    <div className="space-y-8">
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1 text-emerald-500">Create Workspace</h3>
                                <p className="text-zinc-500 text-sm">Workspace successfully provisioned.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1 text-emerald-500">Configure & Integrate</h3>
                                <p className="text-zinc-500 text-sm">Portal settings securely saved.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Select Subscription</h3>
                                <p className="text-zinc-400 text-sm">Select a plan to launch your dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Pricing */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 relative overflow-y-auto py-12">
                <div className="w-full max-w-2xl mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Select a Plan</h2>
                        <p className="text-zinc-400">Unlock your admin dashboard and launch your program.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <PricingCard 
                            title="Base Plan"
                            price="$24"
                            features={[
                                "Up to 100 Active Affiliates",
                                "Unlimited Referrals & Clicks",
                                "Hosted Affiliate Portal",
                                "1 Commission Campaign",
                                "Manual Stripe Payouts Export",
                                "Standard Email Notifications",
                                "Basic Analytics Dashboard",
                                "1 Workspace Admin Seat",
                                "Standard Email Support"
                            ]}
                            buttonText="Start 14-Day Free Trial"
                            formAction={createSaasCheckoutSession}
                            planValue="base"
                            index={0}
                        />

                        <PricingCard 
                            title="Pro Plan"
                            price="$49"
                            features={[
                                "Unlimited Active Affiliates",
                                "Unlimited Referrals & Clicks",
                                "Custom Tenant Domain Mapping",
                                "Unlimited Commission Campaigns",
                                "Custom Affiliate Commissions",
                                "Automated Payouts Processing",
                                "Custom SMTP Email Notifications",
                                "Real-Time Global Webhooks",
                                "Up to 3 Team Member Seats",
                                "Remove 'Powered By' Branding",
                                "Priority Tech Support"
                            ]}
                            isPopular={true}
                            buttonText="Start 14-Day Free Trial"
                            formAction={createSaasCheckoutSession}
                            planValue="pro"
                            index={1}
                        />
                    </div>
                    <div className="mt-8 text-center">
                        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-4">Skip for now, I'll upgrade later</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
