/**
 * Affiliate Tracker — Self-hosted replacement for the PromoteKit CDN script
 * Host this on Netlify at the root of a static site (no build needed).
 *
 * Usage (replace your PromoteKit snippet with):
 *   <script src="https://YOUR-SITE.netlify.app/affiliate-tracker.js"
 *           data-api="https://YOUR-APP.com"
 *           async></script>
 *
 * How it works:
 *  1. Reads ?ref=CODE from the URL → stores in localStorage + cookie (30 days)
 *  2. Injects data-client-reference-id into Stripe Checkout links/buttons
 *  3. Exposes window.AffiliateTracker.getRef() for custom integrations
 *  4. Optionally reads ?promo=CODE and stores it for auto-apply on checkout
 */

(function (global) {
    'use strict';

    var COOKIE_NAME    = 'aff_ref';
    var PROMO_COOKIE   = 'aff_promo';
    var COOKIE_DAYS    = 30;
    var LS_KEY         = 'affiliate_ref';
    var LS_PROMO_KEY   = 'affiliate_promo';
    var TRACKED_ATTR   = 'data-aff-tracked';

    // ── Utilities ────────────────────────────────────────────────────────────

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function getParam(key) {
        try {
            return new URLSearchParams(global.location.search).get(key);
        } catch (e) {
            return null;
        }
    }

    function getScriptAttr(attr) {
        var scripts = document.querySelectorAll('script[src*="affiliate-tracker"]');
        for (var i = 0; i < scripts.length; i++) {
            var val = scripts[i].getAttribute(attr);
            if (val) return val;
        }
        return null;
    }

    // ── Capture ref from URL ─────────────────────────────────────────────────

    function captureRef() {
        var ref   = getParam('ref');
        var promo = getParam('promo');

        if (ref) {
            ref = ref.trim().toUpperCase();
            try { localStorage.setItem(LS_KEY, ref); } catch (e) {}
            setCookie(COOKIE_NAME, ref, COOKIE_DAYS);
            console.log('[AffiliateTracker] Captured ref:', ref);

            // Optionally ping the platform API to record the click
            var apiBase = getScriptAttr('data-api');
            if (apiBase) {
                fetch(apiBase + '/api/track-click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref: ref, url: global.location.href }),
                }).catch(function () {}); // fire-and-forget
            }
        }

        if (promo) {
            promo = promo.trim().toUpperCase();
            try { localStorage.setItem(LS_PROMO_KEY, promo); } catch (e) {}
            setCookie(PROMO_COOKIE, promo, COOKIE_DAYS);
        }
    }

    function getStoredRef() {
        try {
            return localStorage.getItem(LS_KEY) || getCookie(COOKIE_NAME) || null;
        } catch (e) {
            return getCookie(COOKIE_NAME);
        }
    }

    function getStoredPromo() {
        try {
            return localStorage.getItem(LS_PROMO_KEY) || getCookie(PROMO_COOKIE) || null;
        } catch (e) {
            return getCookie(PROMO_COOKIE);
        }
    }

    // ── Inject client_reference_id into Stripe Checkout links ───────────────
    //
    // This supports:
    //   1. <a href="https://buy.stripe.com/..."> links
    //   2. <a href="/checkout"> links that redirect to Stripe
    //   3. Stripe.js redirectToCheckout() via window.Stripe monkey-patch
    //   4. data-stripe-checkout buttons (common patterns)

    function injectIntoStripeLinks(ref) {
        if (!ref) return;

        function patchHref(el) {
            if (el.getAttribute(TRACKED_ATTR)) return;
            var href = el.getAttribute('href') || '';

            if (href.includes('buy.stripe.com') || href.includes('/checkout')) {
                var url = new URL(href, global.location.href);
                url.searchParams.set('client_reference_id', ref);
                el.setAttribute('href', url.toString());
                el.setAttribute(TRACKED_ATTR, '1');
            }
        }

        // Stripe payment links (buy.stripe.com)
        document.querySelectorAll('a[href*="buy.stripe.com"]').forEach(patchHref);
        // App checkout links
        document.querySelectorAll('a[href*="/checkout"], a[href*="checkout"]').forEach(patchHref);
        // Buttons with data-checkout-url attribute
        document.querySelectorAll('[data-checkout-url]').forEach(function (el) {
            if (el.getAttribute(TRACKED_ATTR)) return;
            var url = new URL(el.getAttribute('data-checkout-url'), global.location.href);
            url.searchParams.set('client_reference_id', ref);
            el.setAttribute('data-checkout-url', url.toString());
            el.setAttribute(TRACKED_ATTR, '1');
        });
    }

    // Watch DOM for dynamically added checkout links
    function watchDom(ref) {
        if (!global.MutationObserver) return;
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    injectIntoStripeLinks(ref);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ── Stripe.js monkey-patch ───────────────────────────────────────────────
    // If the site uses Stripe.js's redirectToCheckout, patch it to inject ref

    function patchStripeJs(ref) {
        if (!global.Stripe) return;
        var _originalStripe = global.Stripe;
        global.Stripe = function () {
            var stripe = _originalStripe.apply(this, arguments);
            var _original = stripe.redirectToCheckout.bind(stripe);
            stripe.redirectToCheckout = function (options) {
                if (!options.clientReferenceId) {
                    options.clientReferenceId = ref;
                }
                return _original(options);
            };
            return stripe;
        };
        // Copy static properties
        Object.keys(_originalStripe).forEach(function (k) {
            try { global.Stripe[k] = _originalStripe[k]; } catch (e) {}
        });
    }

    // ── Click-to-track event (optional) ─────────────────────────────────────
    // Expose a helper so the app can call AffiliateTracker.trackCheckout(sessionId)

    function trackCheckout(sessionId) {
        var apiBase = getScriptAttr('data-api');
        var ref = getStoredRef();
        if (!apiBase || !ref || !sessionId) return;
        fetch(apiBase + '/api/track-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: ref, session_id: sessionId }),
        }).catch(function () {});
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    function init() {
        captureRef();
        var ref = getStoredRef();

        if (ref) {
            injectIntoStripeLinks(ref);
            watchDom(ref);
            patchStripeJs(ref);
        }

        // Public API
        global.AffiliateTracker = {
            getRef:       getStoredRef,
            getPromo:     getStoredPromo,
            clearRef:     function () {
                try { localStorage.removeItem(LS_KEY); } catch (e) {}
                setCookie(COOKIE_NAME, '', -1);
            },
            trackCheckout: trackCheckout,
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}(window));
