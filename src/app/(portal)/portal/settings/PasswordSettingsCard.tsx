'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { setPassword } from '@/app/login/actions';
import { toast } from 'sonner';
import { Loader2, KeyRound } from 'lucide-react';

export function PasswordSettingsCard() {
    const [password, setPasswordState] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error("Please enter a new password");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.set('password', password);
            fd.set('confirmPassword', confirmPassword);
            const res = await setPassword(fd);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Password updated successfully!");
                setPasswordState('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error("Save password error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl w-full">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4.5 h-4.5 text-orange-400" />
                </div>
                <div>
                    <CardTitle className="text-lg font-semibold text-zinc-100">Security & Password</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                        Set a password to log in directly to your affiliate portal
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-zinc-300">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            minLength={8}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPasswordState(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword" className="text-zinc-300">Confirm New Password</Label>
                        <Input
                            id="confirmNewPassword"
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-orange-500"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSaving || !password}
                        className="bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded-md mt-2 min-w-[140px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
