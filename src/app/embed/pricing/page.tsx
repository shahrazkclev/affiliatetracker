import { createClient } from '@supabase/supabase-js';
import PricingCard from '@/components/PricingCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PricingEmbedPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let plans: any[] = [];
    try {
        const { data, error } = await supabase
            .from('saas_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (!error && data) {
            plans = data;
        }
    } catch (err) {
        console.error("Embed Pricing API Error:", err);
    }

    // Default fallback if DB fetch fails
    if (plans.length === 0) {
        return (
            <div className="w-full flex justify-center p-8 text-zinc-400">
                Pricing unavailable at the moment.
            </div>
        );
    }

    return (
        <div className="w-full bg-transparent p-4 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
                {plans.map((plan, idx) => (
                    <PricingCard
                        key={plan.id || idx}
                        index={idx}
                        title={plan.name}
                        price={`$${plan.price_amount}`}
                        interval={`/${plan.interval || 'mo'}`}
                        features={plan.features || []}
                        isPopular={plan.is_popular}
                        buttonText={plan.price_amount === 0 ? "Start Free" : `Scale with ${plan.name}`}
                        formAction="https://dashboard.affiliatemango.com/register"
                        planValue={plan.name}
                    />
                ))}
            </div>
        </div>
    );
}
