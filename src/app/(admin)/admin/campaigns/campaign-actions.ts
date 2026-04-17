'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// Service role client — server-only, never exposed to browser
// Bypasses RLS so admin writes always succeed
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function updateCampaign(campaignId: string, formData: FormData) {
    const supabase = getAdminClient();

    const landingUrl = (formData.get('landing_url') as string)?.trim() || null;

    const { data, error } = await supabase.from('campaigns').update({
        name: formData.get('name') as string,
        landing_url: landingUrl,
        default_commission_percent: Number(formData.get('default_commission_percent')) || 30,
        cookie_days: Number(formData.get('cookie_days')) || 30,
        is_default: formData.get('is_default') === 'on',
        show_customer_email: formData.get('show_customer_email') === 'on',
    }).eq('id', campaignId).select();

    if (error) {
        console.error('[updateCampaign] error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/campaigns');
    revalidatePath(`/admin/campaigns?edit=${campaignId}`);
    return { success: true };
}

export async function createCampaign(formData: FormData) {
    const supabase = await createClient();
    
    // Resolve organization identity and limits
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const { data: teamMembership } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
    const orgId = teamMembership?.org_id;
    if (!orgId) return { error: 'No organization found.' };
    
    // Fetch limits
    const { data: org } = await supabase.from('organizations').select('saas_plans(max_campaigns)').eq('id', orgId).single();
    const maxCampaigns = (org?.saas_plans as any)?.max_campaigns;
    
    if (maxCampaigns !== null && maxCampaigns !== undefined) {
        const { count } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
        if ((count || 0) >= maxCampaigns) {
            return { error: `Limit reached. Your plan allows up to ${maxCampaigns} campaigns. Please upgrade to Growth.` };
        }
    }

    const adminClient = getAdminClient();
    const landingUrl = (formData.get('landing_url') as string)?.trim() || null;
    const { data, error } = await adminClient.from('campaigns').insert({
        org_id: orgId,
        name: (formData.get('name') as string)?.trim() || 'New Campaign',
        landing_url: landingUrl,
        default_commission_percent: Number(formData.get('default_commission_percent')) || 30,
        cookie_days: Number(formData.get('cookie_days')) || 30,
        is_default: formData.get('is_default') === 'on',
        show_customer_email: formData.get('show_customer_email') === 'on',
    }).select().single();

    if (error) {
        console.error('[createCampaign] error:', error);
        return { error: error.message };
    }
    revalidatePath('/admin/campaigns');
    return { success: true, id: data?.id };
}

export async function deleteCampaign(campaignId: string) {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

    if (error) {
        console.error('[deleteCampaign] error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/campaigns');
    return { success: true };
}
