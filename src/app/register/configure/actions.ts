'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function updatePortalConfigWizard(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Your session has expired. Please log in again.' };

    const brandColor = (formData.get('brandColor') as string)?.trim() || '#ea580c';
    const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

    // We must find their org. Since we are moving to team_members, let's check BOTH owner_id and team_members just to be safe.
    let orgId = null;

    const { data: teamMembership } = await admin.from('team_members').select('org_id').eq('user_id', user.id).maybeSingle();
    if (teamMembership?.org_id) {
        orgId = teamMembership.org_id;
    } else {
        const { data: orgLookup } = await admin.from('organizations').select('id').eq('owner_id', user.id).maybeSingle();
        if (orgLookup?.id) orgId = orgLookup.id;
    }

    if (!orgId) return { error: 'Organization not found. Please contact support.' };

    // Update organizations
    await admin.from('organizations').update({ primary_color: brandColor, logo_url: logoUrl }).eq('id', orgId);

    // Update portal_configs
    await admin.from('portal_configs').update({ brand_color: brandColor, brand_logo_url: logoUrl }).eq('org_id', orgId);

    redirect('/register/billing');
}
