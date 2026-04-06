'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotificationPreferences } from './actions';

interface NotificationSettingsProps {
    affiliateId: string;
    initialPreferences: {
        new_referral: boolean;
        new_commission: boolean;
        payout_generated: boolean;
        account_approved: boolean;
        account_revision: boolean;
    };
}

export function NotificationSettings({ affiliateId, initialPreferences }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState(initialPreferences);
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = async (key: keyof typeof preferences, checked: boolean) => {
        const newPreferences = { ...preferences, [key]: checked };
        setPreferences(newPreferences);
        setIsSaving(true);

        const result = await updateNotificationPreferences(affiliateId, newPreferences);
        
        setIsSaving(false);
        
        if (!result.success) {
            // Revert on error
            setPreferences(preferences);
            alert(result.error || "Failed to save preferences.");
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-zinc-100">Notifications</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Manage your email alerts and notifications.
                        </CardDescription>
                    </div>
                    {isSaving && <span className="text-xs text-orange-500 animate-pulse">Saving...</span>}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-zinc-300 font-medium">Account Approved</Label>
                        <div className="text-sm text-zinc-500">Get notified when your application is approved.</div>
                    </div>
                    <Switch
                        checked={preferences.account_approved}
                        onCheckedChange={(checked) => handleToggle('account_approved', checked)}
                        className="data-[state=checked]:bg-orange-600 border-zinc-700"
                    />
                </div>
                <div className="border-t border-zinc-800/50"></div>
                
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-zinc-300 font-medium">Action Required (Revision)</Label>
                        <div className="text-sm text-zinc-500">Get notified if we need more information to approve your account.</div>
                    </div>
                    <Switch
                        checked={preferences.account_revision}
                        onCheckedChange={(checked) => handleToggle('account_revision', checked)}
                        className="data-[state=checked]:bg-orange-600 border-zinc-700"
                    />
                </div>
                <div className="border-t border-zinc-800/50"></div>


                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-zinc-300 font-medium">New Commission Alerts</Label>
                        <div className="text-sm text-zinc-500">Get notified when you earn a new commission.</div>
                    </div>
                    <Switch
                        checked={preferences.new_commission}
                        onCheckedChange={(checked) => handleToggle('new_commission', checked)}
                        className="data-[state=checked]:bg-orange-600 border-zinc-700"
                    />
                </div>
                <div className="border-t border-zinc-800/50"></div>
                
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                        <Label className="text-zinc-300 font-medium">Payout Generated Alerts</Label>
                        <div className="text-sm text-zinc-500">Get notified when your payout is processed and sent.</div>
                    </div>
                    <Switch
                        checked={preferences.payout_generated}
                        onCheckedChange={(checked) => handleToggle('payout_generated', checked)}
                        className="data-[state=checked]:bg-orange-600 border-zinc-700"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
