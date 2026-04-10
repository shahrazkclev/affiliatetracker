'use client';

import { useEffect } from 'react';

/**
 * Supabase sometimes falls back to implicit flow (hash tokens) instead of PKCE.
 * This catches #access_token=...&type=recovery anywhere on the site and handles it.
 */
export function AuthHashHandler() {
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) return;

        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (!accessToken || !refreshToken) return;

        import('@/utils/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
                // Clear the hash
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                if (error) {
                    window.location.href = '/login?error=Link+expired+or+invalid';
                    return;
                }
                if (type === 'recovery') {
                    window.location.href = '/reset-password';
                } else {
                    window.location.href = '/portal';
                }
            });
        });
    }, []);

    return null;
}
