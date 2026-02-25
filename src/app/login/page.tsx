import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message?: string; error?: string };
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-slate-200">
            <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white text-center">Cleverpoly Affiliates</CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        {searchParams?.error && (
                            <div className="bg-red-900/50 border border-red-800 text-red-200 px-3 py-2 rounded-md text-sm">
                                {searchParams.error}
                            </div>
                        )}
                        {searchParams?.message && (
                            <div className="bg-green-900/50 border border-green-800 text-green-200 px-3 py-2 rounded-md text-sm">
                                {searchParams.message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="user@cleverpoly.store"
                                required
                                className="bg-black border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-orange-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-black border-slate-800 text-white focus-visible:ring-orange-500"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button formAction={login} type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                Sign In
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
