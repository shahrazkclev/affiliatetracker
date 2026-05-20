const DASHBOARD_HOSTS = new Set(['dashboard.affiliatemango.com', 'admin.affiliatemango.com']);
const PARTNERS_HOST = 'partners.affiliatemango.com';

/** Base URL for AffiliateMango dashboard (platform owner) auth flows */
export function getDashboardSiteUrl(): string {
    const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (env) return env;
    return 'https://dashboard.affiliatemango.com';
}

export async function getRequestHostname(): Promise<string> {
    const { headers } = await import('next/headers');
    const h = await headers();
    const raw = h.get('x-mango-tenant-host') || h.get('x-forwarded-host') || h.get('host') || '';
    return raw.split(',')[0].trim().split(':')[0].toLowerCase();
}

export function isDashboardHostname(hostname: string): boolean {
    return DASHBOARD_HOSTS.has(hostname);
}

/** Base URL for org-portal / affiliate auth flows (tenant domain, partners, or localhost) */
export async function getPortalSiteUrl(): Promise<string> {
    const hostname = await getRequestHostname();
    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    if (isLocal) {
        const port = hostname.includes(':') ? '' : ':3000';
        return `http://${hostname}${port}`;
    }

    if (isDashboardHostname(hostname)) {
        return `https://${PARTNERS_HOST}`;
    }

    if (hostname === PARTNERS_HOST || hostname === 'affiliatemango.com' || hostname === 'www.affiliatemango.com') {
        return `https://${PARTNERS_HOST}`;
    }

    return `https://${hostname}`;
}

/** Supabase auth redirect target — must match an entry in the Supabase redirect allow list */
export function buildAuthCallbackUrl(siteUrl: string, nextPath: string): string {
    const url = new URL('/auth/callback', siteUrl.replace(/\/$/, ''));
    const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    url.searchParams.set('next', next);
    return url.toString();
}

/** Platform-owner signup verification redirect (dashboard only) */
export function getPlatformSignupRedirectTo(): string {
    return buildAuthCallbackUrl(getDashboardSiteUrl(), '/register/configure');
}
