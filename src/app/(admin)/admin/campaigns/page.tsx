import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { CampaignListClient } from "./CampaignListClient";



export default async function CampaignsPage() {
    const supabase = await createClient();

    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });


    // Campaign list view
    return (
        <div className="space-y-4 max-w-7xl mx-auto font-sans">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                        <Megaphone className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Campaigns</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide">Manage commission campaigns</p>
                    </div>
                </div>
                <AddCampaignDialog />
            </div>

            {(!campaigns || campaigns.length === 0) ? (
                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <Megaphone className="w-10 h-10 text-zinc-700 mb-4" />
                        <p className="text-zinc-400 font-semibold mb-1">No campaigns yet</p>
                        <p className="text-zinc-600 text-sm">Create your first campaign to start managing commissions.</p>
                    </CardContent>
                </Card>
            ) : (
                <CampaignListClient campaigns={campaigns || []} />
            )}
        </div>
    );
}
