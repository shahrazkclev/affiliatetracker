'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

            await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                    type: 'INSERT',
                    table: 'payout_requests',
                    record: {
                        affiliate_name: affiliate.name,
                        affiliate_email: affiliate.email,
                        amount,
                        admin_email: adminEmail,
                        _payout_notification: true,
                    },
                }),
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
