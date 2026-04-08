'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveCustomDomain(domain: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data: org } = await supabase
            .from('organizations')
            .select('id, custom_domain')
            .eq('owner_id', user.id)
            .single();

        if (!org) return { success: false, error: 'Org not found' };

        // Ensure domain is clean
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

        // 1. Cloudflare Integration using Environment Variables
        const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
        const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

        if (!CF_ZONE_ID || !CF_API_TOKEN) {
            console.error("Missing Cloudflare API configs in .env.local");
            return { success: false, error: "System is missing Cloudflare API configurations. Contact support." };
        }

        // If they had an old domain, ideally we delete it from CF first or they just add a new one.
        // For simplicity, we just add the new one. (A robust integration would fetch existing custom hostnames and optionally delete them).
        
        if (cleanDomain) {
            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/custom_hostnames`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hostname: cleanDomain,
                    ssl: {
                        method: "http",
                        type: "dv"
                    }
                })
            });

            const cfData = await cfRes.json();
            
            if (!cfData.success) {
                console.error("Cloudflare Error:", cfData.errors);
                return { success: false, error: cfData.errors?.[0]?.message || 'Failed to bind domain at Cloudflare.' };
            }
        }

        // 2. Database Update
        const { error } = await supabase
            .from('organizations')
            .update({
                custom_domain: cleanDomain || null
            })
            .eq('id', org.id);

        if (error) {
            // Need to catch if missing column
            if (error.code === 'PGRST204' || error.message.includes('not found')) {
                return { success: false, error: "Database schema is missing 'custom_domain' column." };
            }
            return { success: false, error: error.message };
        }

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Server error' };
    }
}
