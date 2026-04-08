import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Download } from "lucide-react";
import { DataMigrationDialog } from "./DataMigrationDialog";
import { StripeConnectCard } from "./StripeConnectCard";
import { TrackingSnippetCard } from "./TrackingSnippetCard";
import { PayoutEmailCard } from "./PayoutEmailCard";
import { SmtpSettingsCard } from "./SmtpSettingsCard";
import { createClient } from "@/utils/supabase/server";

export default async function GlobalSettingsPage() {
    const supabase = await createClient();

    // Fetch the most recent last_synced_at from affiliates
    const { data: latestSync } = await supabase
        .from('affiliates')
        .select('last_synced_at')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single();

    const lastSyncedAt = latestSync?.last_synced_at || null;

    // Fetch org settings including SMTP, Domain and Payout Notification
    const { data: org } = await supabase
        .from('organizations')
        .select('payout_notification_email, custom_domain, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email')
        .limit(1)
        .single();

    const portalUrl = org?.custom_domain 
        ? `https://${org.custom_domain}` 
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://affiliatemango.com");

    return (
        <div className="space-y-6 w-full font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <SettingsIcon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">System Configuration</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-orange-500/50 pl-2 ml-1 mt-1">Global parameters & portal rendering</p>
                </div>
            </div>

            <div className="grid gap-6">

                {/* ── Stripe Integration ───────────────────────────────────────── */}
                <StripeConnectCard />
                
                {/* ── Tracking Snippet ───────────────────────────────────────── */}
                <TrackingSnippetCard portalUrl={portalUrl} />

                {/* ── Payout Notification Email ─────────────────────────────────── */}
                <PayoutEmailCard currentEmail={org?.payout_notification_email || null} />

                {/* ── Custom SMTP Settings ─────────────────────────────────────── */}
                <SmtpSettingsCard currentConfig={org || {}} />


                <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
                    <CardHeader className="pb-4 border-b border-zinc-800/50">
                        <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <Download className="w-4 h-4 text-orange-400" /> Platform Migration
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                            Synchronize external PromoteKit matrices manually
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-inner">
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-200">Force Data Pull</h4>
                                <p className="text-xs text-zinc-500 font-mono mt-1">Refreshes Affiliates, Campaigns, and Commissions from upstream.</p>
                                {lastSyncedAt && (
                                    <p className="text-[10px] text-zinc-600 font-mono mt-2">
                                        Last synced: {new Date(lastSyncedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <DataMigrationDialog />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
