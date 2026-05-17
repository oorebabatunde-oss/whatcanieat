# Speed up first paint of the H1

Four targeted changes to make the headline visible sooner on cold loads.

## Changes

1. **Remove the Umami analytics script** from `index.html` (line 108). It's `defer`ed so it doesn't block render, but it's an extra connection and execution on every page that the user wants gone.

2. **Self-host and preload the Playpen Sans 700 latin subset.** The brand H1 currently waits for Google's CSS to download, parse, and request the right subset .woff2.
   - The woff2 has been fetched to `public/fonts/playpen-sans-700-latin.woff2` (~80 KB, latin subset only).
   - Add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/playpen-sans-700-latin.woff2">` near the top of `<head>`.
   - Inline a small `<style>` block with an `@font-face` for Playpen Sans 700 pointing at that local file, with the latin `unicode-range` and `font-display: swap`. The browser will match the H1 against the preloaded file immediately — no waiting on Google.
   - Keep the existing Google Fonts stylesheet so Inter / Manrope / other Playpen weights still load (the inline @font-face wins for 700 latin because of preload).

3. **Remove the H1 entrance animation** in `src/pages/Index.tsx` (lines 106–118). Drop the `motion.div` wrapper around the title, or set `initial={false}` so it paints in its final state on the first frame instead of fading from `opacity: 0` over 500 ms. The button stagger below stays.

4. **Add a static H1 shell inside `#root`** in `index.html` so something paints before React hydrates. A plain `<h1>` with the brand text and the same fonts/sizing as the rendered one, centered on the off-white background. React replaces it on mount; the user sees the headline ~1 s sooner on slow networks.

## Out of scope

- Not removing Framer Motion globally — the button stagger and other in-app animations stay.
- Not touching i18n; the static H1 will be the English brand name (`What Can I Eat?`) — same as the `app.title` default for non-English users until React swaps it.

## After approval

Edit the two files, then surface the publish dialog (the SEO finding is scored against the published version) and mark it fixed.
