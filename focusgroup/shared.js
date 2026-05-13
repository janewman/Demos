/* ============================================================
   Focusgroup Demos - Shared Utilities
   ============================================================
   Common code used across multiple demo pages.
   Include this file (as a classic script) BEFORE
   load-focusgroup.mjs in every demo page.
   ============================================================ */

(function () {
  "use strict";

  // Must match the event name dispatched by load-focusgroup.mjs.
  var EVENT_NAME = "focusgroup-ready";

  /**
   * Centralized implementation-status copy.
   *
   * Chromium 150 ships native `focusgroup` by default (per
   * chromestatus.com/feature/5637601087193088, stage_type 160
   * desktop_first=150). Before that, it was available behind
   * the "Experimental Web Platform features" flag and via the
   * origin trial in Chrome 146–149.
   *
   * Update this constant if the shipping milestone changes
   * before this demo is published.
   */
  var NATIVE_SHIPPING_MILESTONE = "Chromium 150";

  var STATES = {
    native: {
      label: "Native focusgroup",
      expandable: false
    },
    polyfill: {
      label: "Polyfilled focusgroup",
      expandable: true,
      buildBody: function () {
        var body = document.createElement("div");
        body.className = "fg-impl-pill__body";
        body.innerHTML =
          "<p>Your browser doesn't yet support the <code>focusgroup</code> HTML attribute natively, so this page is using the " +
          "<a href=\"https://github.com/microsoft/polyfills/tree/main/packages/focusgroup\">@microsoft/focusgroup-polyfill</a> (v1.4.1).</p>" +
          "<p>Native support is shipping in " + NATIVE_SHIPPING_MILESTONE +
          " (<a href=\"https://chromestatus.com/feature/5637601087193088\">chromestatus</a>). " +
          "To try native behavior today in Edge or another Chromium browser, enable " +
          "<em>Experimental Web Platform features</em> in <code>about://flags</code>, " +
          "restart, and reload this page.</p>" +
          "<p class=\"fg-impl-pill__note\">The polyfill only covers the <code>focusgroup</code> attribute. " +
          "It doesn't add <code>popover</code>, CSS <code>reading-flow</code>, or <code>Element.ariaNotify</code> " +
          "(see the <a href=\"https://github.com/microsoft/polyfills/blob/0955f792/packages/focusgroup/README.md#limitations\">polyfill's Limitations section</a>). " +
          "Append <code>?focusgroup=no-polyfill</code> to the URL to disable the polyfill for debugging.</p>";
        return body;
      }
    },
    unsupported: {
      label: "focusgroup unsupported",
      expandable: true,
      buildBody: function () {
        var body = document.createElement("div");
        body.className = "fg-impl-pill__body";
        body.innerHTML =
          "<p>This browser doesn't support the <code>focusgroup</code> attribute, and we couldn't load the polyfill. " +
          "The demos won't work here. " +
          "Try a recent Chromium-, Gecko-, or WebKit-based browser.</p>";
        return body;
      }
    }
  };

  /**
   * Build the pill DOM for a given state.
   * Native uses a plain <div>. Polyfill / unsupported use <details>.
   */
  function buildPill(state) {
    var cfg = STATES[state];
    if (!cfg) return null;

    var wrap;

    if (cfg.expandable) {
      wrap = document.createElement("details");
      var summary = document.createElement("summary");
      summary.className = "fg-impl-pill__summary";
      summary.innerHTML =
        "<span class=\"fg-impl-pill__dot\" aria-hidden=\"true\"></span> " +
        "<span class=\"fg-impl-pill__text\">" + cfg.label + "</span>";
      wrap.appendChild(summary);
      wrap.appendChild(cfg.buildBody());
    } else {
      wrap = document.createElement("div");
      wrap.innerHTML =
        "<span class=\"fg-impl-pill__dot\" aria-hidden=\"true\"></span> " +
        "<span class=\"fg-impl-pill__text\">" + cfg.label + "</span>";
    }

    wrap.className = "fg-impl-pill fg-impl-pill--" + state;

    return wrap;
  }

  /**
   * Inject the pill into the page header.
   * Placement: AFTER any <nav> inside .page-header (or at the end of .page-header
   * if there's no <nav>). Placing it after the nav avoids inserting a new
   * focusable <summary> in front of an existing tab stop while a user may
   * already be tabbing through the header.
   */
  function injectPill(state) {
    var header = document.querySelector(".page-header");
    if (!header) return;

    // Avoid double-injection if shared.js somehow runs twice or the state
    // updates after an earlier render.
    var existing = header.querySelector(".fg-impl-pill");
    if (existing) existing.remove();

    var pill = buildPill(state);
    if (!pill) return;

    var mount = header.querySelector(".fg-impl-mount");
    if (mount) {
      mount.innerHTML = "";
      mount.appendChild(pill);
      mount.removeAttribute("aria-hidden");
      return;
    }

    // Fallback if the mount wasn't created (shouldn't happen — see ensureMount).
    var nav = header.querySelector("nav");
    if (nav && nav.nextSibling) {
      header.insertBefore(pill, nav.nextSibling);
    } else if (nav) {
      header.appendChild(pill);
    } else {
      header.appendChild(pill);
    }
  }

  /**
   * Create a placeholder mount point in the header synchronously
   * (on DOMContentLoaded). This reserves layout space so the pill
   * doesn't cause CLS when it arrives asynchronously.
   */
  function ensureMount() {
    var header = document.querySelector(".page-header");
    if (!header || header.querySelector(".fg-impl-mount")) return;

    var mount = document.createElement("div");
    mount.className = "fg-impl-mount";
    mount.setAttribute("aria-hidden", "true");

    var nav = header.querySelector("nav");
    if (nav && nav.nextSibling) {
      header.insertBefore(mount, nav.nextSibling);
    } else if (nav) {
      header.appendChild(mount);
    } else {
      header.appendChild(mount);
    }
  }

  /**
   * Render the pill given the current sentinel value.
   * Idempotent — calling repeatedly with the same state is a no-op
   * (well, it re-renders, but the visible result is the same).
   *
   * Announcement policy: SR users hear about state transitions through
   * the shared aria-live region (announceLive), NOT via role="status"
   * on the pill itself. Putting role="status" on a <summary> would
   * override the native disclosure semantics and potentially make the
   * expand control unrecognizable to AT.
   *
   * Announce on:
   *   - First render of "unsupported" (true failure — users need to know).
   *   - Recovery from "unsupported" → "polyfill"|"native" (so a SR
   *     user who heard "focusgroup unsupported" also hears the recovery
   *     instead of being left with stale state).
   * Don't announce:
   *   - First render of "native" or "polyfill" (passive info; not worth
   *     interrupting the page-load reading flow).
   */
  var lastAnnouncedState = null;
  function maybeAnnounce(state) {
    if (state === lastAnnouncedState) return;
    if (state === "unsupported") {
      announce("focusgroup unsupported. The demos won't work in this browser.");
    } else if (lastAnnouncedState === "unsupported") {
      var msg = state === "native"
        ? "Native focusgroup is now active."
        : "focusgroup is now polyfilled.";
      announce(msg);
    }
    lastAnnouncedState = state;
  }

  // Forward declaration — `announce` is defined below as the live-region
  // helper. We need it here so renderForState can call it.
  function announce(text) {
    if (typeof window.focusgroupDemosAnnounce === "function") {
      window.focusgroupDemosAnnounce(text);
    }
  }

  function renderForState(state) {
    if (!STATES[state]) return;
    injectPill(state);
    maybeAnnounce(state);
  }

  /**
   * Race-free wire-up:
   *   1. Attach the focusgroup-ready listener immediately. Module
   *      scripts can dispatch the event before DOMContentLoaded
   *      fires; the listener MUST already exist by then.
   *   2. Synchronously check the sentinel — if it's already set,
   *      we either render now (if DOM is ready) or queue for
   *      DOMContentLoaded.
   *   3. On a 2-second post-DOMContentLoaded timeout with no
   *      sentinel, fall back to "unsupported" — BUT don't lock
   *      that state. If a late `focusgroup-ready` arrives, it
   *      still updates the pill.
   */

  function getSentinel() {
    return document.documentElement.dataset.focusgroupImpl || null;
  }

  function scheduleRender(state) {
    // Defer to DOMContentLoaded so .page-header exists.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        ensureMount();
        renderForState(state);
      }, { once: true });
    } else {
      ensureMount();
      renderForState(state);
    }
  }

  // 1. Event listener — attached immediately, fires whenever the
  //    loader (or anything else) sets the sentinel.
  document.addEventListener(EVENT_NAME, function (e) {
    var state = (e && e.detail && e.detail.state) || getSentinel();
    if (!state) return;
    scheduleRender(state);
  });

  // 2. Synchronous sentinel check — if the loader resolved before
  //    shared.js attached its listener (unlikely with modules but
  //    possible with native sync), render now.
  var earlyState = getSentinel();
  if (earlyState) scheduleRender(earlyState);

  // 3. Timeout safety net. After DOMContentLoaded, give the loader
  //    2s to set the sentinel. If still nothing, render "unsupported".
  //    (The listener above remains active — a late event will
  //    replace the unsupported pill.)
  function startTimeout() {
    setTimeout(function () {
      if (!getSentinel()) {
        scheduleRender("unsupported");
      }
    }, 2000);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTimeout, { once: true });
  } else {
    startTimeout();
  }

  // 4. Make sure the mount placeholder exists even if shared.js
  //    runs before the loader resolves.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureMount, { once: true });
  } else {
    ensureMount();
  }

  /* ============================================================
     announceLive(text)
     ------------------------------------------------------------
     Tiny SR-announcement helper. Used by the chatbot demo as a
     fallback for browsers without `Element.ariaNotify()`.
     Writes to a singleton hidden `aria-live="polite"` region.
     Toggles the text (clear → set) so repeated identical
     announcements still get re-read.
     ============================================================ */
  var liveRegion = null;
  function getLiveRegion() {
    if (liveRegion) return liveRegion;
    liveRegion = document.createElement("div");
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(liveRegion);
    return liveRegion;
  }
  window.focusgroupDemosAnnounce = function (text) {
    var region = getLiveRegion();
    region.textContent = "";
    // requestAnimationFrame to ensure the empty state ticks before the new text
    requestAnimationFrame(function () { region.textContent = String(text || ""); });
  };

  /* ============================================================
     initSingleSelect — preserved from previous shared.js
     ============================================================ */

  /**
   * Set up single-select behavior for a group of items.
   * Adds click and Enter/Space handlers so that exactly one item
   * in the group has its ARIA attribute (e.g. aria-selected) set
   * to "true" at a time.
   *
   * @param {string} containerSelector
   * @param {string} itemSelector
   * @param {string} ariaAttr  "aria-checked" or "aria-selected"
   * @param {string} [selectedClass]
   * @param {Function} [afterSelect]
   */
  window.initSingleSelect = function (containerSelector, itemSelector, ariaAttr, selectedClass, afterSelect) {
    document.querySelectorAll(containerSelector).forEach(function (container) {
      var items = Array.from(container.querySelectorAll(itemSelector));

      function select(target) {
        items.forEach(function (item) {
          var isSelected = item === target;
          item.setAttribute(ariaAttr, String(isSelected));
          if (selectedClass) {
            item.classList.toggle(selectedClass, isSelected);
          }
        });
        if (afterSelect) afterSelect(target, items);
      }

      items.forEach(function (item) {
        item.addEventListener("click", function () { select(item); });
        item.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            select(item);
          }
        });
      });
    });
  };
})();
