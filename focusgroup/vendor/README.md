# Vendored: `@microsoft/focusgroup-polyfill`

We vendor [`@microsoft/focusgroup-polyfill`](https://www.npmjs.com/package/@microsoft/focusgroup-polyfill) here so browsers without native `focusgroup` support still get arrow-key navigation.

## Files

| File | Purpose |
|---|---|
| `focusgroup-polyfill-1.4.1.min.mjs` | The polyfill itself — minified ESM bundle of the "shadowless" build (smaller, since no demo on this page uses Shadow DOM). |
| `LICENSE.focusgroup-polyfill.txt` | Upstream MIT license. The minified bundle does not include a preserved license header, so this file is here to satisfy MIT attribution. |
| `README.md` | This file. |

## Source

| | |
|---|---|
| **Package** | `@microsoft/focusgroup-polyfill` |
| **Version** | `1.4.1` |
| **npm** | https://www.npmjs.com/package/@microsoft/focusgroup-polyfill |
| **Repo** | https://github.com/microsoft/polyfills/tree/main/packages/focusgroup |
| **Downloaded from** | `https://cdn.jsdelivr.net/npm/@microsoft/focusgroup-polyfill@1.4.1/build/index-shadowless.min.mjs` |
| **SHA-256** | `1db5a40b7a2a6bcf5115b43014ba4172ff6cbd0161d6db013519f36729f1588c` |
| **License** | MIT (see `LICENSE.focusgroup-polyfill.txt`) |

## How it's used

The loader at `focusgroup/load-focusgroup.mjs` feature-detects native `focusgroup` support and, if missing, dynamically imports this file and calls `polyfillBodyAndObserve()`. Native support takes precedence.

## Debug override

Append `?focusgroup=no-polyfill` to any focusgroup demo URL to force the loader to skip this polyfill entirely (sentinel will resolve to `unsupported`). Useful for diagnosing whether a bug is caused by the polyfill or by something else.

## Updating

1. Pick a new version (e.g. `1.5.0`).
2. Download the matching shadowless bundle: `curl -O https://cdn.jsdelivr.net/npm/@microsoft/focusgroup-polyfill@<version>/build/index-shadowless.min.mjs`.
3. Verify SHA-256 against the value published on npm (`npm view @microsoft/focusgroup-polyfill@<version> dist`).
4. Rename to `focusgroup-polyfill-<version>.min.mjs` and place in this directory.
5. Update `focusgroup/load-focusgroup.mjs` to import the new filename.
6. Update the version + SHA in this README.
7. Smoke-test all 9 demos with the flag OFF (polyfill mode) and ON (native mode).
8. Delete the old version file.

## Why vendor instead of CDN?

This repo's convention is self-contained demos with no build step or third-party runtime dependency. The polyfill is ~10 KB minified, so committing it is cheap and gives us:

- Same-origin loading (no CDN flakiness).
- Pinned version (no surprise breakage from upstream changes).
- Trivial cache busting via filename versioning.
