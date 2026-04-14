'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchEmail } from "@/lib/email";

export async function requestPayout(affiliateId: string, amount: number) {
    const supabase = await createClient();

    // Get the affiliate and org details
    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('org_id, name, email')
        .eq('id', affiliateId)
        .single();

    if (!affiliate) return { success: false, error: 'Affiliate not found.' };

    // Insert the payout request
    const { error } = await supabase.from('payout_requests').insert({
        affiliate_id: affiliateId,
        org_id: affiliate.org_id,
        amount,
        status: 'pending',
    });

    if (error) return { success: false, error: error.message };

    // Fetch the configured payout notification email
    const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('payout_notification_email')
        .eq('id', affiliate.org_id)
        .single();

    if (orgErr) {
        console.error('[requestPayout] Error fetching org:', orgErr);
    }

    let adminEmail = org?.payout_notification_email || null;

    // Fall back to the signed-in team member (org owner)
    if (!adminEmail) {
        const { data: teamMember } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('org_id', affiliate.org_id)
            .eq('role', 'owner')
            .limit(1)
            .single();

        if (teamMember?.user_id) {
            const { createClient: createAdminClient } = await import('@supabase/supabase-js');
            const adminSupabase = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { data: ownerUser } = await adminSupabase.auth.admin.getUserById(teamMember.user_id);
            adminEmail = ownerUser?.user?.email || null;
        }
    }

    // Send notification email if we have an address
    if (adminEmail) {
        try {
            await dispatchEmail(affiliate.org_id, {
                to: adminEmail,
                subject: `New Payout Request: $${amount}`,
                html: `
                    <h2 style="color: #333333; margin-top: 0; text-align: center;">Payout Request Submitted</h2>
                    <p style="color: #555555; text-align: center; margin-bottom: 20px;">
                        <strong>${affiliate.name}</strong> (${affiliate.email}) has requested a payout withdrawal.
                    </p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 24px; font-weight: bold; color: #10b981;">$${amount.toFixed(2)}</span>
                    </div>
                    <p style="color: #555555; text-align: center; font-size: 14px;">
                        Log in to your Admin Dashboard to review and process this payout.
                    </p>
                `
            });
        } catch (emailErr) {
            console.error('[requestPayout] Email notification failed:', emailErr);
            // Don't fail the whole action if email fails
        }
    }

    revalidatePath('/portal/payouts');
    return { success: true };
}

export async function savePayoutThreshold(affiliateId: string, threshold: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('affiliates')
        .update({ payout_threshold: threshold })
        .eq('id', affiliateId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/portal/payouts');
    return { success: true };
}
