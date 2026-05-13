/* ============================================================
   focusgroup polyfill loader
   ============================================================
   This module is the single source of truth for which
   implementation of the `focusgroup` HTML attribute is active
   on the page:

     - "native"      → the browser supports `focusgroup`. We do
                       NOTHING. The native implementation wins.
     - "polyfill"    → we dynamically import the vendored
                       polyfill and call polyfillBodyAndObserve().
     - "unsupported" → either the polyfill failed to load, or
                       the user passed `?focusgroup=no-polyfill`
                       as a URL flag (for debugging).

   The loader writes the chosen state to:
     document.documentElement.dataset.focusgroupImpl

   and dispatches a `focusgroup-ready` event on `document` so
   `shared.js` (which renders the in-header status pill) can
   react. `shared.js` also reads the sentinel synchronously
   in case the event has already fired by the time it attaches
   its listener.

   We do NOT expose any globals (e.g. window.__focusgroup).
   The polyfill maintains its own internal state and we use
   only the HTML `focusgroup` attribute to communicate with it.

   Loaded by every demo page via:
     <script type="module" src="load-focusgroup.mjs"></script>
   ============================================================ */

const SENTINEL_KEY = "focusgroupImpl";
const EVENT_NAME = "focusgroup-ready";

const setReady = (state) => {
    document.documentElement.dataset[SENTINEL_KEY] = state;
    document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { state } }));
};

const debugFlag = new URL(location.href).searchParams.get("focusgroup");
const forceNoPolyfill = debugFlag === "no-polyfill";

if (!forceNoPolyfill && "focusgroup" in HTMLElement.prototype) {
    setReady("native");
} else if (forceNoPolyfill) {
    setReady("unsupported");
} else {
    // Non-native path — load polyfill. Wrap the FULL setup in
    // try/catch (not just the dynamic import) so any synchronous
    // failure inside polyfillBodyAndObserve() also degrades safely.
    try {
        const mod = await import("./vendor/focusgroup-polyfill-1.4.1.min.mjs");
        mod.polyfillBodyAndObserve();

        // The polyfill defers actual FocusGroup construction to
        // requestAnimationFrame (see polyfill source at v1.4.1:
        // https://github.com/microsoft/polyfills/blob/0955f792/packages/focusgroup/src/polyfill.js).
        // Wait two frames so callers observing `focusgroup-ready` can be
        // confident the DOM is actually decorated when they react.
        await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        setReady("polyfill");
    } catch (err) {
        console.error("focusgroup polyfill failed to load", err);
        setReady("unsupported");
    }
}
