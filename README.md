# Shopify Popup (Shopify Section)

A reusable, production-safe popup section for email signup with configurable triggers, persisted dismiss state, and accessible modal behavior.

## Install
1. Copy files into your theme:
   - `sections/goodr-popup.liquid`
   - `assets/goodr-popup.css`
   - `assets/goodr-popup.js`
2. In Shopify Admin → Online Store → Themes → Customize:
   - Add section **“goodr Popup”** (typically in Theme settings / Footer group / or any template)
   - Toggle **Enable popup**
   - Configure trigger (Delay / Scroll / Exit intent / Manual)

## Enable / Configure
- **Trigger type**
  - Delay: shows after `Delay (seconds)`
  - Scroll: shows after `Scroll trigger (%)`
  - Exit: desktop exit-intent (mouse leaves near top)
  - Manual: no auto trigger; open via `window.goodrPopup[SECTION_ID].open()`
- **Dismiss persistence**
  - Uses `localStorage` keyed by section id
  - TTL configurable via **Dismiss persistence (days)**
  - Option: **Show at most once per TTL** even if user never dismisses

## Behavior & Accessibility
- No CLS: popup markup is rendered hidden by default; fixed overlay/dialog do not affect layout.
- Accessible modal:
  - `role="dialog"`, `aria-modal="true"`, labelled/ described
  - Focus trap inside dialog
  - ESC closes
  - Overlay click closes
  - Restores focus on close
  - Body scroll locked while open

## Integration Stub
- Email validation runs client-side (basic regex).
- Submit handler includes a clear stub where a real integration should live:
  - Replace fake delay with `fetch("/apps/goodr-signup", ...)` or your ESP SDK/serverless endpoint.
- Event logging:
  - Pushes to `window.dataLayer` if present:
    - `goodrp_impression`, `goodrp_dismiss`, `goodrp_submit_attempt`, `goodrp_submit_success`, `goodrp_submit_error`
  - Optional debug logs via section setting **Debug logging**

## Assumptions / Tradeoffs
- Uses localStorage (fast, simple). If you need cross-device suppression, store state server-side (customer metafield/tag).
- Exit intent is desktop-only and intentionally conservative.
- Styling is based on Figma design.

## With more time we can
- Hook into theme typography + color settings automatically
- Add SMS/phone field + country formatting if needed
- Add A/B test hooks and a more robust analytics interface
- Add “do not show on specific templates” and “show only on specific pages”
