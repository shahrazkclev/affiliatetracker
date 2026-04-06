"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code, Terminal } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";

const trackingSnippetCode = `<!-- Affiliate Tracking Script -->
<script>
(function () {
  var CONFIG = {
    refParam: 'ref',
    viaParam: 'via',
    storageKey: 'cpoly_ref',
    timestampKey: 'cpoly_ref_ts',
    ttlDays: 30,
    debug: false,
    trackClickUrl: 'https://partners.cleverpoly.store/api/track-click',
    trackClickEnabled: true
  };

  function log() {
    if (CONFIG.debug) console.log('[CP Affiliate]', ...arguments);
  }

  function getReferralCode() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get(CONFIG.viaParam) || params.get(CONFIG.refParam);
    if (fromUrl && fromUrl.length > 0) return fromUrl;

    var stored = localStorage.getItem(CONFIG.storageKey);
    var ts = parseInt(localStorage.getItem(CONFIG.timestampKey) || '0', 10);
    if (stored && Date.now() - ts < CONFIG.ttlDays * 864e5) return stored;

    return null;
  }

  function storeReferralCode(code) {
    localStorage.setItem(CONFIG.storageKey, code);
    localStorage.setItem(CONFIG.timestampKey, Date.now().toString());
  }

  function updateStripeLinks(code) {
    document.querySelectorAll('a[href*="buy.stripe.com"]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href && !href.includes('client_reference_id')) {
        el.setAttribute('href', href + (href.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(code));
      }
    });

    document.querySelectorAll('[pricing-table-id],[buy-button-id]').forEach(function (el) {
      el.setAttribute('client-reference-id', code);
    });
  }

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
    }).catch(function () {});
  }

  function observe(code) {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      updateStripeLinks(code);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

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
</script>`;

export function TrackingSnippetCard() {
    return (
        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl relative overflow-hidden group">
            <CardHeader className="pb-4 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" /> Tracking Snippet
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-[11px] font-mono mt-1">
                        Deploy this snippet to your main website's &lt;head&gt; tag to track affiliates.
                    </CardDescription>
                </div>
                <CopyButton
                    text={trackingSnippetCode}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50"
                />
            </CardHeader>
            <CardContent className="pt-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-inner max-h-64 overflow-y-auto font-mono text-[11px] text-zinc-400 whitespace-pre">
                    {trackingSnippetCode}
                </div>
                <div className="mt-4 p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-md">
                    <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-emerald-500" /> How It Works
                    </h4>
                    <p className="text-xs text-zinc-400 mb-2">
                        This snippet provides lightning fast, native URL tracking. It requires ZERO external scripts or dependencies.
                        It safely extracts your affiliate payload from the URL (`?via=CODE`) and automatically injects the `client_reference_id` into Stripe Checkout Buttons, Pricing Tables, and dynamic content.
                        It also pings the central system to record link clicks per referral tag.
                    </p>
                    <p className="text-xs text-zinc-400">
                        It persists the referral ID natively in Local Storage for up to 30 days to guarantee attribution even across dropped cart sessions.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
