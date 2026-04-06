/**
 * cleverpoly-tracker.js
 * Self-hosted affiliate referral tracking — drop-in replacement for promotekit.js
 *
 * Usage: Add to <head> of your website (cleverpoly.store):
 *   <script async src="https://affiliates.cleverpoly.store/tracker.js"></script>
 *
 * How it works:
 *   1. Reads ?via=CODE or ?ref=CODE from URL
 *   2. Stores referral code in a cookie (60-day expiry) + localStorage
 *   3. Updates Stripe buy links with client_reference_id
 *   4. Pings the affiliate platform to record the click
 *   5. Works on page load + dynamically added content (MutationObserver)
 */

(function () {
    'use strict';

    const CONFIG = {
        platformUrl: 'https://affiliates.cleverpoly.store',
        cookieName: 'cp_ref',
        cookieDays: 60,
        paramNames: ['via', 'ref', 'r'],   // URL params to check
        debug: false,
        maxRetries: 10,
        retryInterval: 400,
    };

    function log(...args) {
        if (CONFIG.debug) console.log('[Cleverpoly Tracker]', ...args);
    }

    // ── Cookie helpers ──────────────────────────────────────────────────────
    function setCookie(name, value, days) {
        const exp = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Lax`;
    }

    function getCookie(name) {
        const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
    }

    // ── Referral code resolution ────────────────────────────────────────────
    function getReferralFromUrl() {
        const params = new URLSearchParams(window.location.search);
        for (const p of CONFIG.paramNames) {
            const val = params.get(p);
            if (val && val.length > 0) return val;
        }
        return null;
    }

    function getStoredReferral() {
        return getCookie(CONFIG.cookieName) || localStorage.getItem(CONFIG.cookieName) || null;
    }

    function storeReferral(code) {
        setCookie(CONFIG.cookieName, code, CONFIG.cookieDays);
        try { localStorage.setItem(CONFIG.cookieName, code); } catch (_) {}
        // Expose globally like promotekit does
        window.cleverpoly_referral = code;
        window.cp_referral = code;
        log('Stored referral code:', code);
    }

    // ── Click tracking — ping platform API ─────────────────────────────────
    function recordClick(code) {
        try {
            const url = `${CONFIG.platformUrl}/api/track?ref=${encodeURIComponent(code)}&url=${encodeURIComponent(window.location.href)}`;
            // Use sendBeacon for reliability, fallback to fetch
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
            }
            log('Click tracked for:', code);
        } catch (_) {}
    }

    // ── Link injection ──────────────────────────────────────────────────────
    function updateStipeLinks(code) {
        if (!code) return;

        // Stripe buy links
        document.querySelectorAll('a[href*="buy.stripe.com"], a[href*="checkout.stripe.com"]').forEach(el => {
            const href = el.getAttribute('href') || '';
            if (!href.includes('client_reference_id')) {
                const sep = href.includes('?') ? '&' : '?';
                el.setAttribute('href', `${href}${sep}client_reference_id=${code}`);
                log('Updated Stripe link:', el.href);
            }
        });

        // Stripe pricing-table / buy-button web components
        document.querySelectorAll('[pricing-table-id], [buy-button-id]').forEach(el => {
            el.setAttribute('client-reference-id', code);
        });
    }

    // ── MutationObserver for dynamically added content ──────────────────────
    function observeDom(code) {
        if (!window.MutationObserver) return;
        const observer = new MutationObserver(() => updateStipeLinks(code));
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ── Main init ───────────────────────────────────────────────────────────
    function init() {
        // 1. Check URL first (takes priority — this is a new referral visit)
        const urlCode = getReferralFromUrl();
        if (urlCode) {
            storeReferral(urlCode);
            recordClick(urlCode);
            updateStipeLinks(urlCode);
            observeDom(urlCode);
            log('New referral detected from URL:', urlCode);
            return;
        }

        // 2. Check persisted referral (returning visitor within cookie window)
        const stored = getStoredReferral();
        if (stored) {
            window.cleverpoly_referral = stored;
            window.cp_referral = stored;
            updateStipeLinks(stored);
            observeDom(stored);
            log('Rehydrated referral from storage:', stored);
        }
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
