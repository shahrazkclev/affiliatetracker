import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAffiliate } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function AffiliateRegistrationPage({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    const supabase = await createClient();

    // Fetch default campaign configuration
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('default_commission_percent, organizations(name)')
        .eq('is_default', true)
        .single();

    const commission = campaign?.default_commission_percent || 30;
    const orgName = campaign?.organizations?.name || "Cleverpoly";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD] p-4 text-slate-900">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl">
                        C
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Join the {orgName} Affiliate Program</CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                            Earn {commission}% commission on every referral!
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        {searchParams?.error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                                {searchParams.error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="user@cleverpoly.store"
                                required
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-slate-700">Password</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="referralCode" className="text-slate-700">Custom Link Text (Referral Code)</Label>
                            <Input
                                id="referralCode"
                                name="referralCode"
                                type="text"
                                placeholder="e.g. johndoe, chap1course"
                                required
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>

                        <Button formAction={registerAffiliate} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-6 h-11 text-base">
                            Sign Up as Affiliate
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">Already have an affiliate account? </span>
                        <a href="/login" className="text-slate-900 font-medium hover:underline">
                            Sign in
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
