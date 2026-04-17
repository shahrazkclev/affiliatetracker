'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function saveTrackingLinks(affiliateId: string, links: any[]) {
    // Basic verification that the caller is logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const admin = getAdminClient();

    // Verify the affiliate belongs to this user
    const { data: aff } = await admin.from('affiliates').select('id').eq('id', affiliateId).eq('user_id', user.id).single();
    if (!aff) return { error: 'Unauthorized affiliate modification' };

    const { error } = await admin
        .from('affiliates')
        .update({ custom_tracking_links: links })
        .eq('id', affiliateId);

    if (error) return { error: error.message };
    return { success: true };
}
