'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function inviteTeamMember(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { error: 'Email is required' };

    // Verify caller is an owner
    const { data: callerMembership } = await admin.from('team_members').select('org_id, role').eq('user_id', user.id).maybeSingle();
    if (!callerMembership || callerMembership.role !== 'owner') {
        return { error: 'Only owners can invite team members.' };
    }

    const orgId = callerMembership.org_id;

    // Check if user already exists
    let inviteeeId = null;
    const { data: existingUserCheck } = await admin.rpc('check_user_has_password', { user_email: email });
    const userExists = existingUserCheck && existingUserCheck.length > 0;

    if (userExists) {
        // We must fetch their UUID. Since rpc doesn't return UUID directly in this custom function, let's use Admin API
        const { data: listData } = await admin.auth.admin.listUsers();
        const found = listData?.users?.find(u => u.email === email);
        if (found) inviteeeId = found.id;
    }

    if (!inviteeeId) {
        const { data: newAuth, error: createError } = await admin.auth.admin.createUser({
            email,
            email_confirm: true
        });
        if (createError) return { error: createError.message };
        inviteeeId = newAuth.user.id;
    }

    // Insert to team_members
    const { error: insertErr } = await admin.from('team_members').insert({
        org_id: orgId,
        user_id: inviteeeId,
        role: 'admin'
    });

    if (insertErr && insertErr.code !== '23505') { // Ignore unique constraint if they are already in team
        return { error: 'Failed to add user to team.' };
    }

    // Generate Magic Link
    const siteHost = (await import('next/headers')).headers().then(h => h.get("x-mango-tenant-host") || h.get("x-forwarded-host") || h.get("host") || "partners.affiliatemango.com");
    const isLocal = (await siteHost).includes('localhost');
    const SITE_URL = isLocal ? `http://${await siteHost}` : `https://${await siteHost}`;

    const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${SITE_URL}/auth/callback` }
    });

    if (linkData?.properties?.action_link) {
        const { AUTH_LINK_TEMPLATE } = await import('@/lib/email-templates');
        const { dispatchEmail } = await import('@/lib/email');
        
        const { data: orgInfo } = await admin.from('organizations').select('name, logo_url, logo_email_height').eq('id', orgId).maybeSingle();
        const orgName = orgInfo?.name || 'an organization';

        const htmlContent = AUTH_LINK_TEMPLATE(
            'You have been invited',
            `You've been invited to manage the workspace for <b>${orgName}</b>. Click below to securely access the dashboard.`,
            'Access Dashboard',
            linkData.properties.action_link,
            orgInfo?.logo_url,
            orgInfo?.logo_email_height
        );
        await dispatchEmail(orgId, { to: email, subject: `Invitation to ${orgName}`, html: htmlContent, _rawHtmlOverride: true } as any);
    }

    revalidatePath('/admin/team');
    return {};
}

export async function removeTeamMember(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const admin = getAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const memberId = formData.get('memberId') as string;

    // Verify caller is an owner
    const { data: callerMembership } = await admin.from('team_members').select('org_id, role').eq('user_id', user.id).maybeSingle();
    if (!callerMembership || callerMembership.role !== 'owner') {
        return { error: 'Only owners can remove team members.' };
    }

    // Ensure they aren't deleting themselves or other owners (unless allowed, but for now prevent)
    const { data: targetMembership } = await admin.from('team_members').select('id, user_id, role').eq('id', memberId).single();
    
    if (targetMembership?.user_id === user.id) {
        return { error: 'Cannot remove yourself.' };
    }
    if (targetMembership?.role === 'owner') {
        return { error: 'Cannot remove the primary owner.' };
    }

    await admin.from('team_members').delete().eq('id', memberId).eq('org_id', callerMembership.org_id);

    revalidatePath('/admin/team');
    return {};
}
