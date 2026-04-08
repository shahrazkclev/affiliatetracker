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
    // Falls back to the org owner's auth email if not set
    const { data: org } = await supabase
        .from('organizations')
        .select('payout_notification_email, owner_id')
        .eq('id', affiliate.org_id)
        .single();

    let adminEmail = org?.payout_notification_email || null;

    // Fall back to the signed-in user's email (org owner)
    if (!adminEmail && org?.owner_id) {
        const { data: ownerUser } = await supabase.auth.admin.getUserById(org.owner_id);
        adminEmail = ownerUser?.user?.email || null;
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
