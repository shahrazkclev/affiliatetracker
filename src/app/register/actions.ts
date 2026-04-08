'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function registerPlatformOwner(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const companyName = (formData.get('companyName') as string)?.trim() || 'My Company';

    if (!email || !password) return { error: 'Email and password are required.' };
    if (password !== confirmPassword) return { error: 'Passwords do not match.' };
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: companyName, // Can be useful internally
            }
        }
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Failed to create user account.' };

    const userId = authData.user.id;

    // Check if an org already belongs to this user (fail-safe)
    const { data: existingOrg } = await admin
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

    let orgId = existingOrg?.id;

    // If no org exists, provision one!
    if (!orgId) {
        // Generate a base slug from the company name
        let baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!baseSlug) baseSlug = 'tenant';

        // Ensure uniqueness for the slug by checking against existing custom_domains
        let finalSlug = baseSlug;
        let isUnique = false;
        let counter = 0;

        while (!isUnique) {
            const { data: check } = await admin
                .from('organizations')
                .select('id')
                .eq('custom_domain', finalSlug)
                .maybeSingle();

            if (!check) {
                isUnique = true;
            } else {
                counter++;
                finalSlug = `${baseSlug}${counter}`;
            }
        }

        const { data: newOrg, error: orgError } = await admin
            .from('organizations')
            .insert({
                owner_id: userId,
                name: companyName,
                custom_domain: finalSlug // Store the slug here! Real domains will have dots (.) later.
            })
            .select('id')
            .single();

        if (orgError) {
            console.error('[Register] Creating organization failed:', orgError);
            // Optionally clean up the user here if it deeply fails
            return { error: 'Could not provision your organization workspace. Please contact support.' };
        }
        orgId = newOrg.id;

        // Provision default campaign
        const { error: campaignError } = await admin.from('campaigns').insert({
            org_id: orgId,
            name: `${companyName} Affiliate Program`,
            is_default: true,
            reward_type: 'percentage',
            reward_value: 30,
            cookie_days: 60
        });

        if (campaignError) {
            console.error('[Register] Initializing default campaign failed:', campaignError);
        }

        // Provision default portal-config
        const { error: portalError } = await admin.from('portal_configs').insert({
            org_id: orgId,
            company_name: companyName,
            brand_color: '#f97316',
            brand_logo_url: null,
            terms_url: null,
            privacy_url: null
        });

        if (portalError) {
            console.error('[Register] Initializing default portal config failed:', portalError);
        }
    }

    revalidatePath('/', 'layout');

    if (!authData.session) {
        // Email confirmation is required, redirect them to a friendly state instead of forcefully bouncing to /login
        redirect('/login?message=Check your email to verify your account.');
    }

    redirect('/admin');
}
