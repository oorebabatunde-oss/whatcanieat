## Fix decorative-serif flash on home page headline

### Root cause
The home headline in `src/pages/Index.tsx` (line 82) uses an inline style:
```tsx
style={{ fontFamily: "'Playpen Sans', cursive" }}
```

Before Playpen Sans loads from Google Fonts (~300-1500 ms on first paint), the browser resolves the generic `cursive` keyword — which on macOS is **Apple Chancery**, on iOS is **Snell Roundhand**, on Windows is **Comic Sans MS**. That's the italic decorative serif you see in the screenshot for the first ~1 second.

It only happens on the home page because that's the only place `Playpen Sans` is used as a headline — visible during initial paint.

### Fix (3 changes)

**1. `src/pages/Index.tsx` (line 82)** — replace the `cursive` fallback with a sans-serif chain so the flash, if any, is a clean sans-serif (Inter/system) instead of Apple Chancery:
```tsx
style={{ fontFamily: "'Playpen Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
```

**2. `tailwind.config.ts`** — same fix on the `logo` Tailwind utility for consistency:
```ts
logo: ["'Playpen Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
```

**3. `index.html`** — preload the Playpen Sans 700 weight (the one used by the headline) so it's available before first paint, eliminating the flash entirely on warm cache and minimizing it on cold cache:
```html
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Playpen+Sans:wght@700&display=swap"
/>
```
(Insert just before the existing `<link href="...Inter...Manrope...Playpen+Sans..." rel="stylesheet" />`.)

With `display=swap` already on the main fonts URL, the swap will be from a clean sans-serif → Playpen Sans, instead of from Apple Chancery → Playpen Sans.

### Files touched
- `src/pages/Index.tsx`
- `tailwind.config.ts`
- `index.html`

### What changes visually
- **Before:** ~1 sec of Apple Chancery / italic decorative serif on the headline → snaps to Playpen Sans.
- **After:** brief moment of Inter/system sans (visually close in weight to Playpen Sans) → snaps to Playpen Sans. On warm cache and most reloads, no flash at all.
