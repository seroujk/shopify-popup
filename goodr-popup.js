function getUtmCampaignFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("utm_campaign") || "").trim();
}

function utmMatchesRequired(root, debug) {
  const required = (root.dataset.utmCampaign || "").trim();
  const actual = getUtmCampaignFromUrl();

  debug("UTM check → required:", required || "(none)", "| actual:", actual || "(none)");

  if (!required) return false;
  if (!actual) return false;

  const match = actual.toLowerCase() === required.toLowerCase();
  debug("UTM match result:", match);

  return match;
}

// TTL helpers (days in UI, ms in JS)
// Debug mode demo: 1 "day" = 10 seconds
function daysToMs(days, debugEnabled) {
  const d = Number(days) || 0;
  if (debugEnabled) return d * 10 * 1000; // during scenario
  return d * 24 * 60 * 60 * 1000; // real-life scenario
}

function storageKey(root, name) {
  return `goodr_popup:${root.dataset.goodrPopupId || "unknown"}:${name}`;
}

function isWithinTtl(sinceMs, ttlMs) {
  if (!sinceMs) return false;
  return Date.now() - sinceMs < ttlMs;
}

// Body scroll lock helpers (desktop & mobile safe)
let __goodrScrollY = 0;

function lockBodyScroll(debug) {
  __goodrScrollY = window.scrollY || document.documentElement.scrollTop;

  document.body.style.position = "fixed";
  document.body.style.top = `-${__goodrScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";

  debug && debug("body scroll locked at Y:", __goodrScrollY);
}

function unlockBodyScroll(debug) {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, __goodrScrollY);

  debug && debug("body scroll unlocked, restored Y:", __goodrScrollY);
}

/*A11Y HELPERS (modal focus) */

function getFocusableElements(container) {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(container.querySelectorAll(selectors.join(","))).filter((el) => {
    if (el.hasAttribute("hidden")) return false;
    // offsetParent null catches display:none elements
    return el.offsetParent !== null;
  });
}

function trapFocus(modal, onEscape) {
  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape && onEscape();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = getFocusableElements(modal);

    // If nothing focusable, keep focus on modal
    if (focusables.length === 0) {
      e.preventDefault();
      modal.focus({ preventScroll: true });
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  }

  modal.addEventListener("keydown", onKeyDown);
  return () => modal.removeEventListener("keydown", onKeyDown);
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-goodr-popup-root]");
  if (!root) return;

  const debugEnabled = root.dataset.debug === "true";
  const debug = (...args) => {
    if (!debugEnabled) return;
    console.log("[goodr popup]", ...args);
  };

  // Integration stub (event logging + where real integrations would live)
  function trackPopupEvent(eventName, data = {}) {
    const payload = {
      event: eventName,
      component: "goodr_popup",
      popupId: root.dataset.goodrPopupId || "unknown",
      triggerType: root.dataset.triggerType || null,
      utmCampaign: getUtmCampaignFromUrl() || null,
      timestamp: Date.now(),
      ...data,
    };

    // For demo
    debug("[event]", payload);

     /*
      REAL INTEGRATIONS WOULD LIVE HERE:

      Google Tag Manager / GA4
        window.dataLayer?.push(payload);
          or: gtag?.('event', eventName, data);

      Meta Pixel
        fbq?.('trackCustom', eventName, data);

      Shopify App Proxy / Backend endpoint
        fetch('/apps/popup-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
    */
  }

  debug("initialized");

  const popUp = root.querySelector(".goodr_popup__content");
  const closeBtn = root.querySelector(".goodr_popup__close__button");
  const ctaBtn = root.querySelector(".goodr_popup__cta__button");
  const dismissBtn = root.querySelector(".goodr_popup__dismissal__button");

  if (!popUp) {
    debug("popup content not found — aborting");
    return;
  }

  const triggerType = root.dataset.triggerType;
  debug("trigger type:", triggerType);

  if (!triggerType) return;

  // TTL config + guard (blocks showing when within TTL)
  const ttlDays = Number(root.dataset.dismissTtlDays || 1);
  const ttlMs = daysToMs(ttlDays, debugEnabled);

  const showOncePerTtl = root.dataset.showOncePerTtl === "true";

  const dismissedAtKey = storageKey(root, "dismissedAt");
  const shownAtKey = storageKey(root, "shownAt");

  const dismissedAt = Number(localStorage.getItem(dismissedAtKey) || 0);
  const shownAt = Number(localStorage.getItem(shownAtKey) || 0);

  debug("TTL config:", {
    ttlDays,
    ttlMs,
    showOncePerTtl,
    dismissedAt: dismissedAt || null,
    shownAt: shownAt || null,
  });

  // 1) If dismissed within TTL then block popup
  if (isWithinTtl(dismissedAt, ttlMs)) {
    debug("blocked: dismissed within TTL");
    trackPopupEvent("popup_blocked", { reason: "dismissed_within_ttl" });
    return;
  }

  // 2) If show-once-per-TTL is enabled and it was shown within TTL then block popup
  if (showOncePerTtl && isWithinTtl(shownAt, ttlMs)) {
    debug("blocked: already shown within TTL");
    trackPopupEvent("popup_blocked", { reason: "shown_within_ttl" });
    return;
  }

  // Demo helper: reset TTL quickly from console when debug is on
  if (debugEnabled) {
    window.goodrPopupReset = () => {
      localStorage.removeItem(dismissedAtKey);
      localStorage.removeItem(shownAtKey);
      debug("reset: cleared TTL storage keys");
    };
    debug("demo helper: run goodrPopupReset() to clear TTL");
  }

  let hasShown = false;

  // A11Y state
  let lastActiveElement = null;
  let cleanupFocusTrap = null;

  const showPopupOnce = () => {
    if (hasShown) {
      debug("popup already shown — skipping");
      return;
    }

    debug("showing popup");
    lastActiveElement = document.activeElement;

    popUp.hidden = false;
    hasShown = true;

    // Freeze page scroll while popup is open
    lockBodyScroll(debug);

    // Record "shown" so show_once_per_ttl works
    localStorage.setItem(shownAtKey, String(Date.now()));

    // Log event
    trackPopupEvent("popup_viewed");

    // A11Y: focus into dialog + trap focus + escape closes
    const focusTarget = closeBtn || popUp;
    focusTarget.focus({ preventScroll: true });

    cleanupFocusTrap = trapFocus(popUp, () => dismissPopup("escape_key"));
  };

  // Accept a method so we know *how* it was dismissed
  const dismissPopup = (method = "unknown") => {
    debug("popup dismissed:", method);
    popUp.hidden = true;

    // A11Y: remove focus trap
    if (cleanupFocusTrap) {
      cleanupFocusTrap();
      cleanupFocusTrap = null;
    }

    // Unfreeze page scroll when popup closes
    unlockBodyScroll(debug);

    // Record dismissal so dismiss_ttl_days works
    localStorage.setItem(dismissedAtKey, String(Date.now()));

    // Log event
    trackPopupEvent("popup_dismissed", { method });

    // A11Y: restore focus to opener
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus({ preventScroll: true });
    }
  };

  if (ctaBtn) ctaBtn.addEventListener("click", () => dismissPopup("cta"));
  if (dismissBtn) dismissBtn.addEventListener("click", () => dismissPopup("dismiss_button"));
  if (closeBtn) closeBtn.addEventListener("click", () => dismissPopup("close_button"));

  // TRIGGER TYPE: UTM
  if (triggerType === "utm") {
    debug("UTM trigger active");
    if (utmMatchesRequired(root, debug)) {
      showPopupOnce();
    } else {
      debug("UTM trigger did not match — popup not shown");
      trackPopupEvent("popup_not_shown", { reason: "utm_no_match" });
    }
    return;
  }

  // TRIGGER TYPE: DELAY
  if (triggerType === "delay") {
    const delaySeconds = Number(root.dataset.delaySection || 0);
    debug("delay trigger set:", delaySeconds, "seconds");

    setTimeout(() => {
      debug("delay trigger fired");
      showPopupOnce();
    }, delaySeconds * 1000);
  }

  // TRIGGER TYPE: SCROLL
  if (triggerType === "scroll") {
    const scrollPercentTrigger = Number(root.dataset.scrollPercent || 0);
    debug("scroll trigger set:", scrollPercentTrigger, "%");

    const handleScrollTrigger = () => {
      if (hasShown) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      const totalScrollable = docHeight - winHeight;
      if (totalScrollable <= 0) return;

      const currentScrollPercent = (scrollTop / totalScrollable) * 100;

      debug("scroll percent:", currentScrollPercent.toFixed(2));

      if (currentScrollPercent >= scrollPercentTrigger) {
        debug("scroll trigger fired");
        showPopupOnce();
        document.removeEventListener("scroll", handleScrollTrigger);
      }
    };

    document.addEventListener("scroll", handleScrollTrigger, { passive: true });
    handleScrollTrigger();
  }

  // TRIGGER TYPE: EXIT INTENT
  if (triggerType === "exit") {
    debug("exit intent trigger active");

    const handleExitTrigger = (event) => {
      if (hasShown) return;

      if (event.clientY <= 8) {
        debug("exit intent detected");
        showPopupOnce();
        document.removeEventListener("mousemove", handleExitTrigger);
      }
    };

    document.addEventListener("mousemove", handleExitTrigger);
  }
});
