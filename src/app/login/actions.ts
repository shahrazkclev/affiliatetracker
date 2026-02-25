'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
    const supabase = await createClient();

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        redirect('/login?error=Could not authenticate user');
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: authData, error } = await supabase.auth.signUp({ email, password });

    if (error || !authData.user) {
        redirect('/login?error=Could not authenticate user');
    }

    // Scaffold new organization for the Admin
    const { data: orgData, error: orgError } = await supabase.from('organizations').insert({
        owner_id: authData.user.id,
        name: `${email.split('@')[0]}'s Organization`,
        logo_url: '',
        stripe_account_id: '',
        custom_domain: '',
        terms_url: '',
        theme: 'dark'
    }).select().single();

    if (orgError || !orgData) {
        console.error("Error creating organization for new admin:", orgError);
        redirect('/login?error=Could not configure organization');
    }

    // Scaffold a default campaign for this organization
    await supabase.from('campaigns').insert({
        org_id: orgData.id,
        name: 'Default Campaign',
        default_commission_percent: 30,
        is_default: true,
    });

    revalidatePath('/', 'layout');
    redirect('/login?message=Check email to continue sign in process');
}
