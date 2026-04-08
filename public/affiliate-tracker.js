/**
 * AffiliateMango Affiliate Tracking Snippet
 * ----------------------------------------
 * Drop this snippet on ANY page of your storefront where Stripe buy buttons live.
 * It reads the affiliate referral code from the URL (?ref=CODE), stores it in
 * localStorage (30-day TTL), then appends client_reference_id to all Stripe links
 * so Stripe passes it back to your webhook → your commission system fires.
 *
 * Works exactly like the PromoteKit snippet — but 100% your own system.
 *
 * Usage:
 *   1. Paste inside <head> or just before </body> on your storefront.
 *   2. Replace SUPABASE_URL and ANON_KEY if you want click tracking.
 *   3. Affiliate links should look like: https://yourstore.com/pricing?ref=AFFILIATECODE
 */

(function () {
  var CONFIG = {
    refParam: 'ref',                // URL param holding the referral code (legacy fallback)
    viaParam: 'via',                // Primary URL param containing CODE+TAG
    storageKey: 'cpoly_ref',        // localStorage key
    timestampKey: 'cpoly_ref_ts',   // localStorage TTL key
    ttlDays: 30,                    // how long to remember the referral
    debug: false,                   // set true to see console logs
    trackClickUrl: 'https://affiliatemango.com/api/track-click',
    trackClickEnabled: true,        // log server-side click metrics automatically
  };

  function log() {
    if (CONFIG.debug) console.log('[CP Affiliate]', ...arguments);
  }

  // ─── 1. Read referral code ────────────────────────────────────────────────
  function getReferralCode() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get(CONFIG.viaParam) || params.get(CONFIG.refParam);
    if (fromUrl && fromUrl.length > 0) return fromUrl;

    // Fallback: read from localStorage if within TTL
    var stored = localStorage.getItem(CONFIG.storageKey);
    var ts = parseInt(localStorage.getItem(CONFIG.timestampKey) || '0', 10);
    if (stored && Date.now() - ts < CONFIG.ttlDays * 864e5) return stored;

    return null;
  }

  // ─── 2. Persist in localStorage ──────────────────────────────────────────
  function storeReferralCode(code) {
    localStorage.setItem(CONFIG.storageKey, code);
    localStorage.setItem(CONFIG.timestampKey, Date.now().toString());
    log('Stored referral code:', code);
  }

  // ─── 3. Append client_reference_id to all Stripe buy links ───────────────
  function updateStripeLinks(code) {
    // buy.stripe.com direct links
    document.querySelectorAll('a[href*="buy.stripe.com"]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href && !href.includes('client_reference_id')) {
        el.setAttribute('href', href + (href.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(code));
        log('Updated Stripe link');
      }
    });

    // Stripe Pricing Tables / Buy Buttons (web components)
    document.querySelectorAll('[pricing-table-id],[buy-button-id]').forEach(function (el) {
      el.setAttribute('client-reference-id', code);
      log('Updated Stripe web component');
    });

    log('All Stripe links updated for code:', code);
  }

  // ─── 4. ping server to log click ───────────────────────────────
  function trackClick(code) {
    if (!CONFIG.trackClickEnabled) return;
    fetch(CONFIG.trackClickUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        url: window.location.href,
        referrer: document.referrer
      }),
      keepalive: true,
    }).catch(function () {}); // silent — never block page load
  }

  // ─── 5. Observe dynamically injected Stripe elements ─────────────────────
  function observe(code) {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      updateStripeLinks(code);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    var params = new URLSearchParams(window.location.search);
    var freshCode = params.get(CONFIG.viaParam) || params.get(CONFIG.refParam);

    if (freshCode) {
      storeReferralCode(freshCode);
      trackClick(freshCode);
    }

    var code = getReferralCode();
    if (!code) {
      log('No referral code found');
      window.AFFILIATE_TRACKER_READY = true;
      return;
    }

    log('Active referral code:', code);
    updateStripeLinks(code);
    observe(code);
    window.AFFILIATE_TRACKER_READY = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
