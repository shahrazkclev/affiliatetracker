import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteTeamMember, removeTeamMember } from './actions';
import { Users, UserPlus, ShieldAlert, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function TeamSettingsPage() {
    const supabase = await createClient();
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: currentUserTeam } = await admin.from('team_members').select('org_id, role').eq('user_id', user.id).maybeSingle();
    const orgId = currentUserTeam?.org_id;
    if (!orgId) redirect('/login');

    const isOwner = currentUserTeam.role === 'owner';

    // Fetch team members
    const { data: members, error } = await admin.from('team_members').select('id, user_id, role, created_at').eq('org_id', orgId).order('created_at', { ascending: true });

    // Since users don't expose emails via standard table querying (it's hidden in Auth), we have to fetch their emails via the admin api
    let enrichedMembers: any[] = [];
    if (members && members.length > 0) {
        const { data: usersData } = await admin.auth.admin.listUsers();
        const usersList = usersData?.users || [];
        
        enrichedMembers = members.map(m => {
            const authUser = usersList.find(u => u.id === m.user_id);
            return {
                ...m,
                email: authUser?.email || 'Unknown User'
            };
        });
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Team Management</h1>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide">Invite administrators and operators to your workspace.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-zinc-900 rounded-2xl border-zinc-800 shadow-xl overflow-hidden">
                        <CardHeader className="bg-zinc-950/50 border-b border-zinc-800/80 px-6 py-5">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                Active Members
                            </CardTitle>
                            <CardDescription className="text-zinc-400">Users with access to this organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                {enrichedMembers.map(m => (
                                    <div key={m.id} className="flex justify-between items-center p-6 hover:bg-zinc-800/20 transition-colors">
                                        <div>
                                            <p className="font-semibold text-zinc-200">{m.email}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                    m.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                    {m.role}
                                                </span>
                                            </div>
                                        </div>
                                        {m.user_id !== user.id && isOwner && (
                                            <form action={removeTeamMember}>
                                                <input type="hidden" name="memberId" value={m.id} />
                                                <Button type="submit" variant="ghost" className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        )}
                                        {m.user_id === user.id && (
                                            <span className="text-xs text-zinc-500 font-medium px-3 py-1 bg-zinc-800 rounded-md">You</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="bg-zinc-900 rounded-2xl border-zinc-800 shadow-xl overflow-hidden border-t-2 border-t-orange-500">
                        <CardHeader className="px-6 py-5">
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Invite User
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-0">
                            {isOwner ? (
                                <form action={inviteTeamMember} className="space-y-4">
                                    <div>
                                        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email Address</Label>
                                        <Input 
                                            name="email" 
                                            type="email" 
                                            placeholder="team@example.com" 
                                            className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500"
                                            required 
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold h-10 shadow-lg shadow-orange-500/20">
                                        Send Invitation
                                    </Button>
                                    <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed text-center">Invited users will receive an email to access this Dashboard as an Admin.</p>
                                </form>
                            ) : (
                                <div className="text-center py-4 text-zinc-500 flex flex-col items-center">
                                    <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">Only the workspace owner can invite new members.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
