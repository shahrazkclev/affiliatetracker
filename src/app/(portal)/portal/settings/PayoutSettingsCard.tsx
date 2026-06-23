'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePayoutSettings } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PayoutSettingsCardProps {
    affiliateId: string;
    initialPaypalEmail: string;
    initialWiseEmail: string;
}

export function PayoutSettingsCard({ affiliateId, initialPaypalEmail, initialWiseEmail }: PayoutSettingsCardProps) {
    const [paypalEmail, setPaypalEmail] = useState(initialPaypalEmail);
    const [wiseEmail, setWiseEmail] = useState(initialWiseEmail);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updatePayoutSettings(affiliateId, { paypalEmail, wiseEmail });
            if (res.success) {
                toast.success("Payout settings updated successfully!");
            } else {
                toast.error(res.error || "Failed to update payout settings");
            }
        } catch (error) {
            console.error("Save payouts error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-100">Payouts</CardTitle>
                <CardDescription className="text-zinc-500 text-sm">
                    Configure how you want to get paid. You can set different email destinations for PayPal and Wise.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="paypalEmail" className="text-zinc-300">PayPal Payout Email</Label>
                    <Input
                        id="paypalEmail"
                        type="email"
                        placeholder="your-paypal@email.com"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                    />
                    <p className="text-xs text-zinc-500">Used for payments processed via PayPal.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wiseEmail" className="text-zinc-300">Wise Payout Email</Label>
                    <Input
                        id="wiseEmail"
                        type="email"
                        placeholder="your-wise@email.com"
                        value={wiseEmail}
                        onChange={(e) => setWiseEmail(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                    />
                    <p className="text-xs text-zinc-500">Used for bank transfers processed via Wise.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded-md mt-2 min-w-[150px]"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Payout Info"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
