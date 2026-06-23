'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProfileSettingsCardProps {
    affiliateId: string;
    initialFirstName: string;
    initialLastName: string;
    initialEmail: string;
}

export function ProfileSettingsCard({ affiliateId, initialFirstName, initialLastName, initialEmail }: ProfileSettingsCardProps) {
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [email, setEmail] = useState(initialEmail);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!firstName.trim()) {
            toast.error("First name cannot be empty");
            return;
        }
        if (!email.trim()) {
            toast.error("Email cannot be empty");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateProfile(affiliateId, { firstName, lastName, email });
            if (res.success) {
                if (res.emailChanged) {
                    toast.success("Profile updated! Please check your new email for a verification link to confirm the change.");
                } else {
                    toast.success("Profile updated successfully!");
                }
            } else {
                toast.error(res.error || "Failed to update profile");
            }
        } catch (error) {
            console.error("Save profile error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-100">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                        <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                        <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                    />
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded-md mt-2 min-w-[120px]"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
