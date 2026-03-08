

## Problem

Google Fonts are loaded via CSS `@import` in `src/index.css`, which means the browser must first download the CSS bundle, then discover and fetch the font files. During this time, the browser falls back to the default serif font (Times New Roman), causing a visible flash of unstyled text (FOUT).

## Fix

1. **Add `<link rel="preconnect">` and `<link>` tags to `index.html`** to load the Google Fonts early (before CSS is parsed), and add `font-display: swap` handling.

2. **Remove the `@import url(...)` line from `src/index.css`** since the fonts will already be loaded via the HTML `<link>`.

3. **Add a fallback font-display strategy** in `index.css` body rule — set `font-family` with system sans-serif fallbacks so the flash shows a sans-serif instead of serif even if fonts haven't loaded yet.

### Changes

**`index.html`** — Add before `</head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playpen+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

**`src/index.css`** — Remove line 1 (`@import url(...)`) since fonts are now loaded from HTML.

This ensures fonts start downloading immediately on page load rather than waiting for CSS to be parsed, eliminating the serif flash.

