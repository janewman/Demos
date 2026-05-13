# Focusgroup demos

➡️ **[Open the demo](https://microsoftedge.github.io/Demos/focusgroup/)** ⬅️

Interactive demos for the HTML `focusgroup` attribute, which lets you add arrow-key navigation to composite widgets (the roving tabindex pattern) without author-written JavaScript for focus management.

These demos run in current browsers. If a browser supports `focusgroup`, the page uses the native implementation. If it doesn't, the vendored [`@microsoft/focusgroup-polyfill`](https://github.com/microsoft/polyfills/tree/main/packages/focusgroup) handles the same arrow-key behavior. Each page shows a small status pill in the header so you can see which path you're using.

## Demos

> **Note:** The `focusgroup` behavior token maps a minimum ARIA role to generic containers (e.g., a plain `<div>`) and can infer child roles (e.g., `tab` on `<button>` inside a `tablist`). These demos rely on that automatic mapping. Explicit `role` attributes are only used for intentional overrides (e.g., `role="group"` on the accordion to prevent the `toolbar` role).

- [Index](https://microsoftedge.github.io/Demos/focusgroup/index.html): Overview page with a quick-demo toolbar and navigation to all demos
- [Toolbar](https://microsoftedge.github.io/Demos/focusgroup/toolbar.html): Toolbar demos using inline and block navigation
- [Tablist](https://microsoftedge.github.io/Demos/focusgroup/tablist.html): Tab control using the `tablist` behavior token (which defaults to inline + wrap), with `nomemory` to reset focus position on re-entry
- [Menu & Menubar](https://microsoftedge.github.io/Demos/focusgroup/menu.html): Vertical menu and horizontal menubar with nested submenus
- [Radio Group](https://microsoftedge.github.io/Demos/focusgroup/radiogroup.html): Radio button group navigation
- [Listbox](https://microsoftedge.github.io/Demos/focusgroup/listbox.html): Selectable list navigation
- [Accordion](https://microsoftedge.github.io/Demos/focusgroup/accordion.html): Accordion with block-axis arrow key navigation using `focusgroup="toolbar block"` and `role="group"`
- [Additional Concepts](https://microsoftedge.github.io/Demos/focusgroup/additional-concepts.html): Nested focusgroups, opt-out, deep descendants, CSS `reading-flow` integration, feature detection

## Learn more

- [Focusgroup Explainer (Open UI)](https://open-ui.org/components/scoped-focusgroup.explainer/)
- [Focusgroup polyfill (GitHub)](https://github.com/microsoft/polyfills/tree/main/packages/focusgroup) ([npm: `@microsoft/focusgroup-polyfill`](https://www.npmjs.com/package/@microsoft/focusgroup-polyfill))
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)

## Browser support

These demos work in any current Chromium-, Gecko-, or WebKit-based browser. The status pill in each page header tells you which implementation is running:

- **✅ Native focusgroup** — your browser supports the attribute natively. Native support ships by default in **Chromium 150** ([chromestatus.com](https://chromestatus.com/feature/5637601087193088)) and is available before that via the *Experimental Web Platform features* flag.
- **🧩 Polyfilled focusgroup** — `@microsoft/focusgroup-polyfill` (vendored in `vendor/`) provides the behavior. The pill's expand control includes instructions for enabling the native implementation if you'd like to compare.
- **⚠ focusgroup unsupported** — your browser couldn't load the polyfill (extremely old browser). The demos won't work here.

For debugging: append `?focusgroup=no-polyfill` to any demo URL to force the polyfill off (useful for isolating whether a bug is caused by the polyfill).

The polyfill only covers the `focusgroup` attribute. It doesn't add `popover`, CSS `reading-flow`, or `Element.ariaNotify`, so a specific demo can still behave differently if your browser lacks one of those features. (See the polyfill's [Limitations section](https://github.com/microsoft/polyfills/blob/0955f792/packages/focusgroup/README.md#limitations) for the full list of behaviors the polyfill does and doesn't replicate.)

## Contributing a new demo

When adding a new `*.html` page under `/focusgroup/`, include the same two scripts every other page does, in this order, just before `</body>`:

```html
<script src="shared.js"></script>
<script type="module" src="load-focusgroup.mjs"></script>
```

Use `../shared.js` and `../load-focusgroup.mjs` from inside a subdirectory (see `chatbot/index.html`). `shared.js` injects the status pill into `.page-header`, and `load-focusgroup.mjs` handles the native-vs-polyfill detection.

