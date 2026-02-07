# goodr Popup — Shopify Section

A configurable promotional popup built as a **Shopify section** using **Liquid, scoped CSS, and vanilla JavaScript**.

This popup is production-ready and demo-friendly, supporting multiple trigger types, persistence rules (TTL), UTM targeting, debug logging, and safe body scroll locking on desktop and mobile.

---

### Figma Link
- https://www.figma.com/design/T5WoIoi7eGP2B46g9U0Scp/Digital-Developer-Assignment?node-id=0-1&p=f&t=IWnke5ZID7JxhI25-0

### Assets Link
- https://drive.google.com/drive/folders/12xJH6lZ5pUpHJw2f1d79AI0qW0YvnVPI?usp=drive_link

### Deck Link

- https://docs.google.com/presentation/d/10_E-iCOSgreRfYMOKL3tt2gYRQqWXYgDmzb0gwokuuU/edit?usp=sharing


## Features

- **Trigger Types**
  - Time delay
  - Page scroll percentage
  - Exit intent (desktop)
  - UTM campaign match

- **Persistence (Real-Life Behavior)**
  - Dismiss TTL (don’t show again for X days after dismissal)
  - Show-once-per-TTL (optional)

- **Debug Mode**
  - Toggleable via section setting
  - Console logs prefixed with `[goodr popup]`
  - Accelerated TTL for demos (1 “day” = 10 seconds)

- **UX Enhancements**
  - Background scroll lock while popup is open (desktop + mobile safe)
  - Responsive desktop/mobile layouts
  - Fully scoped styles (safe to drop into any theme)

---

## Files Included

You will add **three files** to your Shopify theme:

1. `sections/goodr-popup.liquid`
2. `assets/goodr-popup.css`
3. `assets/goodr-popup.js`

---

## Installation (Add to Any Shopify Theme)

### 1. Open the Theme Code Editor
Shopify Admin → **Online Store** → **Themes** → (Active theme) → **⋯** → **Edit code**

---

### 2. Add the Section File

- In **Sections**, click **Add a new section**
- Select : goodr-popup.liquid
- Paste the full `goodr-popup.liquid` code
- Save
- This section already loads its CSS and JS automatically:


### 3. Add the CSS File

- Go to Assets
- Click Add a new asset
- Choose Create a blank file
- Name it: goodr-popup.css
- Paste the full `goodr-popup.css` code
- Save

### 4. Add the JavaScript File

- Go to Assets
- Click Add a new asset
- Choose Create a blank file
- Name it: goodr-popup.js
- Paste the full `goodr-popup.js` code
- Save

### 5. Adding the Popup to a Page

- Recommended (Theme Editor)
- Go to Online Store → Themes → Customize
- Navigate to the template you want (Home, Collection, Product, etc.)
- Click Add section
- Select goodr Popup
- Configure the settings
- Save

### Section Settings Overview

- Enable Pop up
- Popup close icon
- Desktop image
- Mobile image
- Logo
- Title (before code)
- Coupon code
- Title (after code)
- CTA button text
- Dismissal button text
- Trigger Type
- Choose one trigger type: Time delay, Page Scroll Percentage, Exit intent, UTM Campaign match


### Additional trigger settings:

- Delay (seconds)
- Scroll trigger (%)
- Enable exit intent (desktop only)
- UTM campaign match value
- Persistence Settings (TTL)
- Dismiss persistence (days)

### If the popup is dismissed

- it will not show again until this TTL expires
- Set to 0 to disable dismissal persistence
- Show at most once per TTL

### If enabled

- The popup will show only once during the TTL window, even if the user does not dismiss it

### Debug Logging

## Enable Debug logging to:
- See detailed console logs
- Use accelerated TTL (1 day = 10 seconds)
- Access the debug reset helper
- UTM Trigger Usage

### To trigger the popup via UTM:

- Set Trigger type → UTM Campaign match
- Set UTM campaign match to a value (example: popup_offer)
- Visit a URL like: /collections/all?utm_campaign=popup_offer
- The popup will display immediately if the value matches.

### Debug & Demo Mode

## When Debug logging is enabled console logs appear with:

- [goodr popup]
- TTL is accelerated:
- 1 “day” = 10 seconds
- Reset TTL Instantly (Debug Only)
- In the browser console: goodrPopupReset()
- This clears all TTL-related storage so you can re-test immediately.

### How TTL Works (Technical Overview)

- Two timestamps are stored in localStorage, scoped by section ID:
- shownAt → when the popup was shown
- dismissedAt → when the popup was dismissed

## Keys look like:

- goodr_popup:<section_id>:shownAt
- goodr_popup:<section_id>:dismissedAt

### Rules

- If dismissed within TTL → popup is blocked
- If show-once-per-TTL is enabled and already shown within TTL → popup is blocked
- When TTL expires → popup is allowed again
- Scroll Lock Behavior


### When the popup opens:
- The page behind it is frozen using an iOS-safe position: fixed technique

### When the popup closes:

- Scroll position is restored exactly where the user left off

### Troubleshooting

## Popup does not appear

- Confirm the section is added to the page
- Enable Debug logging
- Check console logs for trigger output
- UTM trigger not firing
- Confirm URL uses utm_campaign (underscore, not dash)
- Confirm the value exactly matches the section setting

## Popup only shows once

- It may be blocked by TTL rules
- In debug mode, run: goodrPopupReset()


### Customization

- Update layout and styling in goodr-popup.css
- Modify trigger logic in goodr-popup.js
- Adjust content and settings in goodr-popup.liquid

### Notes

- CTA clicks are treated as dismissals by default (counts toward dismiss TTL)
- Exit intent is desktop-focused (mouse-based)
- All logic is vanilla JS (no dependencies)


### Optional Future Enhancements

- Overlay click-to-close
- ESC key close + focus trapping (accessibility)
- Multiple UTM campaign matches
- Analytics events (view, dismiss, CTA)

### Tradeoffs & Decisions

- Theme-based implementation vs app
- Client-side state vs server-side persistence.
- CTA-only popup vs email capture
- Event tracking stub vs live integrations
- Single-trigger execution per page load
