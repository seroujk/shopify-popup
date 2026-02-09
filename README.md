# goodr Popup — Shopify Section

A configurable promotional popup built as a **Shopify section** using **Liquid**, **scoped CSS**, and **vanilla JavaScript**.

Designed to ship safely ahead of launch, this popup is easy to enable/disable, avoids customer disruption, and is extensible for future analytics or email capture.

---

## Links

- **Figma:** https://www.figma.com/design/T5WoIoi7eGP2B46g9U0Scp/Digital-Developer-Assignment
- **Assets:** https://drive.google.com/drive/folders/12xJH6lZ5pUpHJw2f1d79AI0qW0YvnVPI
- **Deck:** https://docs.google.com/presentation/d/10_E-iCOSgreRfYMOKL3tt2gYRQqWXYgDmzb0gwokuuU

---

## Key Features

### Trigger Types
- Time delay
- Scroll percentage
- Exit intent (desktop)
- UTM campaign match

### Frequency Control
- Dismiss persistence (TTL in days)
- Optional show-once-per-TTL behavior

### UX Safety
- Mobile-safe background scroll lock
- Responsive layouts
- Fully scoped styles (safe for any theme)

### Debug Mode
- Console logging for QA
- Accelerated TTL for demos
- Reset helper for rapid testing

---

## Installation & Enablement

### Files

Add the following to your Shopify theme:

- `sections/goodr-popup.liquid`
- `assets/goodr-popup.css`
- `assets/goodr-popup.js`

### Enable the Popup

1. Shopify Admin → **Online Store → Themes → Customize**
2. Navigate to the desired template (Home, Collection, Product, etc.)
3. **Add section → goodr Popup**
4. Configure settings and toggle **Enable popup**
5. Save

> No deploy is required to enable or disable the popup.

---

## Configuration Overview (Non-Technical)

- Enable / disable popup
- Choose trigger type (delay, scroll, exit, UTM)
- Control how often it appears (TTL)
- Update copy, images, and CTA text
- Optional debug mode for testing

---

## Key Assumptions & Tradeoffs

### Theme-based section vs Shopify app
Chosen for speed, safety, and ease of control by E-Commerce.  
**Tradeoff:** less centralized logic than a full app.

### Client-side persistence
Popup frequency is managed in the browser.  
**Tradeoff:** lightweight and fast, but behavior is device/browser-specific.

### CTA-only design
Matches the provided Figma.  
**Tradeoff:** no email capture yet, but tracking hooks are in place for future expansion.

### Analytics stub instead of live integrations
Events are abstracted behind a single tracking function.  
**Tradeoff:** no live data by default, but a safe, clear integration seam.

### Single trigger per page load
Simplifies behavior and avoids conflicts.  
**Tradeoff:** fewer combined trigger scenarios.

---

## What I’d Improve With More Time

- Support for multiple UTM campaign values
- Server-side or app-backed persistence for cross-device behavior
- Live analytics integrations (GA4, Meta, or backend endpoint)

---

## Notes

- CTA clicks are treated as dismissals by default
- Overlay clicks are treated as dismissals by default
- Exit intent is desktop-focused
- All logic is dependency-free vanilla JavaScript
