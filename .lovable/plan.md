

## Elevating the Design: From Playful to Refined

The main source of the "juvenile" feel is **Playpen Sans** (a bubbly, handwriting-style font) and the large emoji icons used throughout. Here's a plan to make it feel clean, sophisticated, and creative while keeping it simple.

### Key Changes

**1. Typography Upgrade**
- Replace **Playpen Sans** with **DM Serif Display** (elegant serif for headings) — shows design taste
- Keep **Manrope** as the body font (already clean and modern)
- This single change has the biggest impact on perceived sophistication

**2. Welcome Screen Refinements**
- Reduce emoji sizes from `text-4xl` to `text-2xl` — they become accents, not the focal point
- Add subtle letter-spacing to the tagline for a refined editorial feel
- Make buttons wider with more horizontal padding for a polished, intentional layout

**3. Quiz Step Polish**
- Reduce emoji sizes across CravingStep, FlavorStep, TextureStep
- Add `uppercase tracking-wide text-xs` styling to step labels/subtitles for editorial feel
- Use slightly more padding and generous whitespace in chip buttons

**4. Color Refinement**
- Shift `--muted` from purple-tinted (`270 20% 90%`) to a neutral sage tone (`160 8% 92%`) — removes the last juvenile color
- Keep the green (#5A9870) buttons and the colorful flavor chips — those show creativity

### Files to Edit
- `src/index.css` — swap Google Font import, update `--muted` color
- `tailwind.config.ts` — update `font-display` family
- `src/pages/Index.tsx` — emoji sizes, button spacing, tagline styling
- `src/components/quiz/CravingStep.tsx` — emoji size, label styling
- `src/components/quiz/FlavorStep.tsx` — subtitle styling
- `src/components/quiz/TextureStep.tsx` — subtitle styling
- `src/components/quiz/ResultsScreen.tsx` — heading style

