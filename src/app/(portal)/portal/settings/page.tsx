import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/server";

export default async function AffiliateSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the current affiliate's data
    let affiliate = null;
    if (user) {
        const { data } = await supabase
            .from('affiliates')
            .select('*')
            .eq('email', user.email)
            .single();
        affiliate = data;
    }

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

                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-zinc-100">Notifications</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Manage your email alerts and notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-300 font-medium">New Referral Alerts</Label>
                                <div className="text-sm text-zinc-500">Get notified when someone signs up using your link.</div>
                            </div>
                            <Switch checked={true} className="data-[state=checked]:bg-orange-600 border-zinc-700" />
                        </div>
                        <div className="border-t border-zinc-800/50"></div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-300 font-medium">New Commission Alerts</Label>
                                <div className="text-sm text-zinc-500">Get notified when you earn a new commission.</div>
                            </div>
                            <Switch checked={true} className="data-[state=checked]:bg-orange-600 border-zinc-700" />
                        </div>
                        <div className="border-t border-zinc-800/50"></div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-300 font-medium">Payout Generated Alerts</Label>
                                <div className="text-sm text-zinc-500">Get notified when your payout is processed and sent.</div>
                            </div>
                            <Switch checked={true} className="data-[state=checked]:bg-orange-600 border-zinc-700" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
