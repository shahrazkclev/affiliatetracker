# Affiliate Tracker Snippet — Netlify Hosting

This folder is a standalone static site. Deploy it to Netlify to host the tracking snippet.

## Deploy Steps

1. **Create a new Netlify site** from this folder (drag the `netlify-snippet/` folder to app.netlify.com)
2. No build command needed — it's a single static JS file
3. Your snippet URL will be `https://YOUR-NETLIFY-SITE.netlify.app/affiliate-tracker.js`

---

## Replace your PromoteKit snippet with:

```html
<!-- Affiliate Tracker — hosted on Netlify -->
<script
  src="https://YOUR-NETLIFY-SITE.netlify.app/affiliate-tracker.js"
  data-api="https://YOUR-APP.com"
  async
></script>
```

Replace:
- `YOUR-NETLIFY-SITE` → your Netlify subdomain
- `YOUR-APP.com` → your admin platform domain (used for click tracking API calls)

---

## How it works

| Feature | How |
|---|---|
| **Capture affiliate ref** | Reads `?ref=CODE` from URL on page load |
| **Persist 30 days** | Stores in `localStorage` + cookie |
| **Inject into Stripe links** | Adds `client_reference_id=CODE` to `buy.stripe.com` links and `/checkout` links automatically |
| **Stripe.js support** | Monkey-patches `stripe.redirectToCheckout()` to inject `clientReferenceId` |
| **Promo code** | Reads `?promo=CODE` and stores it (`window.AffiliateTracker.getPromo()`) |

---

## JavaScript API

```javascript
// Get the stored affiliate ref code
const ref = window.AffiliateTracker.getRef();       // "JOHN25" or null

// Get any stored promo code (from ?promo=)
const promo = window.AffiliateTracker.getPromo();   // "SUMMER20" or null

// Clear the stored ref (e.g. after a successful checkout)
window.AffiliateTracker.clearRef();

// Manually fire a checkout tracking event
window.AffiliateTracker.trackCheckout('cs_stripe_session_id');
```

---

## How commissions are created

When a customer completes checkout with an affiliate's ref code:

```
User visits site with ?ref=JOHN25
    → Cookie + localStorage stores JOHN25
    → Stripe Checkout link becomes: buy.stripe.com/...?client_reference_id=JOHN25

Customer completes checkout
    → Stripe fires checkout.session.completed event
    → Your webhook at /api/webhooks/stripe receives it
    → Reads client_reference_id = JOHN25
    → Finds affiliate with referral_code = JOHN25
    → Creates commission record in Supabase
```
