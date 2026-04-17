import { createClient } from "@/utils/supabase/server";
import { User, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";

export async function CustomersView({ orgId, searchQuery, currentPage, PAGE_SIZE }: { orgId: string, searchQuery: string, currentPage: number, PAGE_SIZE: number }) {
    const supabase = await createClient();
    
    const start = (currentPage - 1) * PAGE_SIZE;

    // Get exact total counts for summaries (fast, without loading rows)
    const { count: totalCustomersCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

    const { count: payingCustomersCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['paying', 'active', 'paid']);

    // Build the query with actual database-level pagination
    let query = supabase
        .from("referrals")
        .select("id, customer_email, stripe_customer_id, status, created_at, affiliate:affiliates(name, email, referral_code), commissions(amount)", { count: 'exact' })
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

    if (searchQuery) {
        // Because of joined tables (affiliates), filtering across joins dynamically is limited in standard postgrest without a view.
        // If we strictly search local columns, it is much faster:
        query = query.or(`customer_email.ilike.%${searchQuery}%,stripe_customer_id.ilike.%${searchQuery}%`);
    }

    query = query.range(start, start + PAGE_SIZE - 1);
    
    // Execute query
    const { data: rawCustomers, count: filteredCount } = await query;
    const customersSegment = rawCustomers || [];
    
    const totalCustomers = totalCustomersCount || 0;
    const payingCustomers = payingCustomersCount || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" /> Total Referred Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                            {totalCustomers}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Monetized Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-indigo-400 font-mono tracking-tight">
                            {payingCustomers}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                <th className="px-6 py-4 whitespace-nowrap">Referred By</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Commissions Generated</th>
                                <th className="px-6 py-4 whitespace-nowrap">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {customersSegment.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <p className="text-zinc-500 font-medium">No customers found.</p>
                                    </td>
                                </tr>
                            ) : (
                                customersSegment.map((customer: any) => {
                                    const totalCommission = customer.commissions?.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0) || 0;
                                    const isActive = customer.status === 'paying' || customer.status === 'active' || totalCommission > 0;
                                    
                                    return (
                                    <tr key={customer.id} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-200">{customer.customer_email}</span>
                                            </div>
                                            {customer.stripe_customer_id && (
                                                <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                                                    Stripe: {customer.stripe_customer_id}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.affiliate ? (
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-300 font-medium">{customer.affiliate.name}</span>
                                                    <span className="text-xs text-zinc-500 font-mono">{customer.affiliate.referral_code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.status ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                                    <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                                        {customer.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-zinc-300">${totalCommission.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(customer.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pt-4 border-t border-zinc-800/50">
                {filteredCount && filteredCount > PAGE_SIZE && (
                    <div className="flex justify-between items-center px-4 w-full">
                        <Pagination 
                            totalCount={filteredCount} 
                            pageSize={PAGE_SIZE} 
                            currentPage={currentPage}
                        />
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
