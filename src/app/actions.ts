'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function registerAffiliate(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const referralCode = formData.get('referralCode') as string;

    // Sign up the affiliate user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError || !authData.user) {
        redirect('/?error=' + encodeURIComponent(authError?.message || 'Could not create account'));
    }

    // Get the default campaign and org
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, org_id')
        .eq('is_default', true)
        .single();

    if (campaign) {
        // Insert into affiliates table
        const { error: insertError } = await supabase.from('affiliates').insert({
            user_id: authData.user.id,
            org_id: campaign.org_id,
            campaign_id: campaign.id,
            name,
            email,
            referral_code: referralCode,
        });

        if (insertError) {
            console.error("Error inserting affiliate", insertError);
            redirect('/?error=' + encodeURIComponent(insertError.message || 'Error configuring affiliate profile'));
        }
    }

    // Check email or redirect directly since we might be auto-logged in
    redirect('/portal?message=Welcome to your affiliate portal');
}
