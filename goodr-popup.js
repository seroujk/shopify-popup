(() => {
    const ROOT_ATTR = "data-txtp-root";
  
    function nowMs() {
      return Date.now();
    }
  
    function daysToMs(days) {
      return Number(days) * 24 * 60 * 60 * 1000;
    }
  
    function safeJsonParse(val, fallback) {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
  
    function isEmailValid(email) {
      // pragmatic email validation for signup forms
      const v = String(email || "").trim();
      if (!v) return false;
      // basic RFC-ish pattern (not perfect, intentionally)
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    }
  
    function trapFocus(dialog, onDeactivate) {
      const selectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(",");
  
      const getFocusable = () => Array.from(dialog.querySelectorAll(selectors))
        .filter((el) => el.offsetParent !== null);
  
      function onKeyDown(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          onDeactivate?.();
          return;
        }
        if (e.key !== "Tab") return;
  
        const focusables = getFocusable();
        if (!focusables.length) return;
  
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
  
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
  
      document.addEventListener("keydown", onKeyDown);
  
      // focus first element
      const focusables = getFocusable();
      (focusables[0] || dialog).focus();
  
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    }
  
    function lockBodyScroll(lock) {
      const body = document.body;
      if (!body) return;
  
      if (lock) {
        const scrollY = window.scrollY || 0;
        body.dataset.txtpScrollY = String(scrollY);
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
      } else {
        const y = Number(body.dataset.txtpScrollY || "0");
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        delete body.dataset.txtpScrollY;
        window.scrollTo(0, y);
      }
    }
  
    function logEvent(root, name, payload = {}) {
      const debug = root.dataset.debug === "true";
      const base = {
        component: "txt-popup",
        id: root.dataset.txtpId,
        ts: new Date().toISOString(),
        ...payload,
      };
  
      // Integration stub: wire to your analytics/event bus here
      // Example: window.dataLayer?.push({ event: name, ...base });
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: name, ...base });
      }
  
      if (debug) console.log(`[txt-popup] ${name}`, base);
    }
  
    function storageKey(sectionId) {
      return `txtp:${sectionId}`;
    }
  
    function getState(root) {
      const key = storageKey(root.dataset.txtpId);
      const raw = localStorage.getItem(key);
      return safeJsonParse(raw, null);
    }
  
    function setState(root, state) {
      const key = storageKey(root.dataset.txtpId);
      localStorage.setItem(key, JSON.stringify(state));
    }
  
    function isSuppressed(root) {
      const ttlDays = Number(root.dataset.dismissTtlDays || "14");
      const showOnce = root.dataset.showOncePerTtl === "true";
      const state = getState(root);
  
      if (!state) return false;
  
      const ttlMs = daysToMs(ttlDays);
  
      // dismissed within TTL
      if (state.dismissedAt && (nowMs() - state.dismissedAt) < ttlMs) return true;
  
      // shown once within TTL (even if not dismissed)
      if (showOnce && state.shownAt && (nowMs() - state.shownAt) < ttlMs) return true;
  
      return false;
    }
  
    function markShown(root) {
      const state = getState(root) || {};
      setState(root, { ...state, shownAt: nowMs() });
    }
  
    function markDismissed(root, reason) {
      const state = getState(root) || {};
      setState(root, { ...state, dismissedAt: nowMs(), dismissedReason: reason || "unknown" });
    }
  
    function initOne(root) {
      const overlay = root.querySelector("[data-txtp-overlay]");
      const dialog = root.querySelector("[data-txtp-dialog]");
      const btnClose = root.querySelector("[data-txtp-close]");
      const form = root.querySelector("[data-txtp-form]");
      const emailEl = root.querySelector("[data-txtp-email]");
      const submitBtn = root.querySelector("[data-txtp-submit]");
      const errorEl = root.querySelector("[data-txtp-error]");
      const successEl = root.querySelector("[data-txtp-success]");
  
      if (!overlay || !dialog) return;
  
      let cleanupFocusTrap = null;
      let isOpen = false;
      let lastActiveEl = null;
  
      function show(source) {
        if (isOpen) return;
        if (isSuppressed(root)) return;
  
        isOpen = true;
        lastActiveEl = document.activeElement;
  
        overlay.hidden = false;
        dialog.hidden = false;
  
        lockBodyScroll(true);
        cleanupFocusTrap = trapFocus(dialog, () => hide("escape"));
  
        markShown(root);
        logEvent(root, "txtp_impression", { source });
      }
  
      function hide(reason) {
        if (!isOpen) return;
  
        isOpen = false;
        overlay.hidden = true;
        dialog.hidden = true;
  
        cleanupFocusTrap?.();
        cleanupFocusTrap = null;
  
        lockBodyScroll(false);
  
        markDismissed(root, reason);
        logEvent(root, "txtp_dismiss", { reason });
  
        if (lastActiveEl && typeof lastActiveEl.focus === "function") {
          lastActiveEl.focus();
        }
      }
  
      // Overlay click closes
      overlay.addEventListener("click", () => hide("overlay"));
  
      // Close button
      btnClose?.addEventListener("click", () => hide("close_button"));
  
      // Prevent clicks inside dialog from closing
      dialog.addEventListener("click", (e) => e.stopPropagation());
  
      // Form submit: validate + integration stub
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        errorEl.hidden = true;
        successEl.hidden = true;
  
        const email = (emailEl?.value || "").trim();
  
        if (!isEmailValid(email)) {
          errorEl.textContent = "Please enter a valid email address.";
          errorEl.hidden = false;
          logEvent(root, "txtp_submit_invalid", { email });
          emailEl?.focus();
          return;
        }
  
        submitBtn.disabled = true;
        logEvent(root, "txtp_submit_attempt", { email });
  
        try {
          /**
           * Integration stub:
           * Replace with your real endpoint / app proxy / ESP SDK.
           * Examples:
           * - Klaviyo: POST to your serverless endpoint -> Klaviyo subscribe API
           * - Attentive: call Attentive signup endpoint
           * - Shopify Customer: create/update customer with tags (needs backend/app)
           */
          await fakeNetworkDelay(450);
  
          // Example "where the real integration would live":
          // await fetch("/apps/txt-signup", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email }) });
  
          successEl.hidden = false;
          successEl.textContent = successEl.textContent || "Thanks for signing up!";
          logEvent(root, "txtp_submit_success", { email });
  
          // Optional: auto-close after success
          setTimeout(() => hide("success_autoclose"), 900);
        } catch (err) {
          errorEl.textContent = "Something went wrong. Please try again.";
          errorEl.hidden = false;
          logEvent(root, "txtp_submit_error", { message: String(err?.message || err) });
        } finally {
          submitBtn.disabled = false;
        }
      });
  
      function fakeNetworkDelay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
  
      // Trigger logic
      const triggerType = root.dataset.triggerType || "delay";
      const delaySec = Number(root.dataset.delaySeconds || "5");
      const scrollPercent = Number(root.dataset.scrollPercent || "35");
      const exitIntentEnabled = root.dataset.exitIntent === "true";
  
      // Manual API
      window.TXTPopup = window.TXTPopup || {};
      window.TXTPopup[root.dataset.txtpId] = {
        open: () => show("manual"),
        close: () => hide("manual"),
      };
  
      if (triggerType === "manual") return;
      if (isSuppressed(root)) return;
  
      if (triggerType === "delay") {
        window.setTimeout(() => show("delay"), Math.max(0, delaySec) * 1000);
        return;
      }
  
      if (triggerType === "scroll") {
        let fired = false;
  
        function onScroll() {
          if (fired) return;
          const doc = document.documentElement;
          const max = (doc.scrollHeight || 1) - (window.innerHeight || 1);
          const p = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
  
          if (p >= scrollPercent) {
            fired = true;
            window.removeEventListener("scroll", onScroll, { passive: true });
            show("scroll");
          }
        }
  
        window.addEventListener("scroll", onScroll, { passive: true });
        // in case they land mid-page
        onScroll();
        return;
      }
  
      if (triggerType === "exit" && exitIntentEnabled) {
        // Desktop-only: pointer moving toward top
        let fired = false;
  
        function onMouseOut(e) {
          if (fired) return;
          // If leaving viewport near top
          if (e.clientY <= 8) {
            fired = true;
            document.removeEventListener("mouseout", onMouseOut);
            show("exit_intent");
          }
        }
  
        // Don't run on touch devices
        const isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
        if (!isTouch) {
          document.addEventListener("mouseout", onMouseOut);
        }
        return;
      }
    }
  
    function initAll() {
      const roots = document.querySelectorAll(`[${ROOT_ATTR}]`);
      roots.forEach(initOne);
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAll);
    } else {
      initAll();
    }
  })();
  