'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSmtpSettings(host: string, port: string, userStr: string, pass: string, fromEmail: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!org) return { success: false, error: 'Org not found' };

        // We attempt to update the SMTP config columns on the organizations table.
        // If the backend has not run the required ALTER TABLE migration, this query will fail
        // gracefully with a specific error we can display to the user.
        const { error } = await supabase
            .from('organizations')
            .update({
                smtp_host: host || null,
                smtp_port: port ? parseInt(port, 10) : null,
                smtp_user: userStr || null,
                smtp_pass: pass || null,
                smtp_from_email: fromEmail || null,
            })
            .eq('id', org.id);

        if (error) {
            console.error('SMTP Setup Error:', error.message);
            // Catch schema missing column error:
            if (error.code === 'PGRST204' || error.message.includes('not found') || error.message.includes('column')) {
                return { 
                    success: false, 
                    error: "Database schema is missing SMTP columns. Please run the SQL migration." 
                };
            }
            return { success: false, error: error.message };
        }

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Server error' };
    }
}
