import { createClient, getResolvedOrgId, getActiveAffiliateProfile } from "@/utils/supabase/server";
import { NotificationSettings } from "./NotificationSettings";
import { ProfileSettingsCard } from "./ProfileSettingsCard";
import { PayoutSettingsCard } from "./PayoutSettingsCard";
import { PasswordSettingsCard } from "./PasswordSettingsCard";
import { redirect } from "next/navigation";

export default async function AffiliateSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const orgId = await getResolvedOrgId();
    if (!orgId) redirect("/login");

    // Fetch the current affiliate's data
    const affiliate = await getActiveAffiliateProfile(orgId, user.email || '');

    if (!affiliate) redirect("/portal");

    // Split name for first/last name fields
    const nameParts = affiliate?.name ? affiliate.name.split(' ') : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Separate payout email fallbacks
    const defaultPayout = affiliate?.payout_email || affiliate?.email || user?.email || '';
    const paypalEmail = affiliate?.paypal_email || defaultPayout;
    const wiseEmail = affiliate?.wise_email || defaultPayout;

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 tracking-tight">Account settings</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <ProfileSettingsCard 
                        affiliateId={affiliate.id}
                        initialFirstName={firstName}
                        initialLastName={lastName}
                        initialEmail={affiliate?.email || user?.email || ''}
                    />

                    <PasswordSettingsCard />
                </div>

                <div className="space-y-6">
                    <PayoutSettingsCard 
                        affiliateId={affiliate.id}
                        initialPaypalEmail={paypalEmail}
                        initialWiseEmail={wiseEmail}
                    />

                    <NotificationSettings 
                        affiliateId={affiliate?.id || ''}
                        initialPreferences={{
                            new_referral: affiliate?.notify_new_referral ?? true,
                            new_commission: affiliate?.notify_new_commission ?? true,
                            payout_generated: affiliate?.notify_payout_generated ?? true,
                            account_approved: affiliate?.notify_account_approved ?? true,
                            account_revision: affiliate?.notify_account_revision ?? true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

