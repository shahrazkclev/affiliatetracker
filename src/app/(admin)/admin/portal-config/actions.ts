'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPortalConfig() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('organizations')
        .select('id, name, logo_url, custom_domain, primary_color, theme, logo_sidebar_height, logo_email_height, plan_name, is_free_forever')
        .limit(1)
        .single();
    return data;
}

export async function uploadLogoAndSave(formData: FormData) {
    const supabase = await createClient();

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

    if (!org) return { error: 'No organization found' };

    const file = formData.get('logo') as File;
    if (!file || !file.name) return { error: 'No file provided' };

    const ext = file.name.split('.').pop();
    const filename = `org-${org.id}-logo.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from('portal-assets')
        .upload(filename, file, { upsert: true, contentType: file.type });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrl } = supabase.storage
        .from('portal-assets')
        .getPublicUrl(filename);

    const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl.publicUrl })
        .eq('id', org.id);

    if (updateError) return { error: updateError.message };

    revalidatePath('/admin/portal-config');
    revalidatePath('/portal', 'layout');
    return { success: true, url: publicUrl.publicUrl };
}

export async function saveBrandingSettings(
    primaryColor: string,
    theme: string,
    logoSidebarHeight: number,
    logoEmailHeight: number
) {
    const supabase = await createClient();

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

    if (!org) return { error: 'No organization found' };

    const { error } = await supabase
        .from('organizations')
        .update({
            primary_color: primaryColor,
            theme,
            logo_sidebar_height: logoSidebarHeight,
            logo_email_height: logoEmailHeight,
        })
        .eq('id', org.id);

    if (error) return { error: error.message };

    revalidatePath('/admin/portal-config');
    revalidatePath('/portal', 'layout');
    return { success: true };
}
