import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient, getResolvedOrgId } from "@/utils/supabase/server";
import { NotificationSettings } from "./NotificationSettings";
import { redirect } from "next/navigation";

export default async function AffiliateSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const orgId = await getResolvedOrgId();
    if (!orgId) redirect("/login");

    // Fetch the current affiliate's data
    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', user.email)
        .eq('org_id', orgId)
        .single();

    // Split name for first/last name fields
    const nameParts = affiliate?.name ? affiliate.name.split(' ') : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';


    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Account settings</h2>
            </div>

            <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-100">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                                <Input id="firstName" defaultValue={firstName} className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                                <Input id="lastName" defaultValue={lastName} className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                            <Input id="email" type="email" defaultValue={affiliate?.email || user?.email || ''} className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500" />
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded-md mt-2">
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-100">Payouts</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Configure how you want to get paid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payoutEmail" className="text-zinc-300">Payout Email (PayPal/Wise)</Label>
                            <Input
                                id="payoutEmail"
                                type="email"
                                defaultValue={affiliate?.payout_email || affiliate?.email || user?.email || ''}
                                className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                            />
                            <p className="text-xs text-zinc-500">The email address where your commissions will be sent.</p>
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded-md mt-2">
                            Save Payout Info
                        </Button>
                    </CardContent>
                </Card>

                <NotificationSettings 
                    affiliateId={affiliate?.id || ''}
                    initialPreferences={{
                        new_referral: affiliate?.notify_new_referral ?? true,
                        new_commission: affiliate?.notify_new_commission ?? true,
                        payout_generated: affiliate?.notify_payout_generated ?? true,
                        account_approved: affiliate?.notify_account_approved ?? true,
                        account_revision: affiliate?.notify_account_revision ?? true,
                    }}
                />
            </div>
        </div>
    );
}
