

## Design Refinement Plan

Based on the design brief and current codebase audit, here's what needs to change to achieve the "subtle sophistication" aesthetic inspired by Uber/Wise.

### 1. Typography & Font Scale

**Current issue**: Playpen Sans (handwritten cursive) conflicts with the "minimalistic, calm, trustworthy" direction. The brief says "sans-serif typography, modern and highly legible."

**Change**: Replace Playpen Sans with a clean geometric display font (e.g., Inter or keep Manrope for both, using weight contrast). Add CSS custom properties for font weight tokens.

- `index.html`: Update Google Fonts link
- `tailwind.config.ts`: Update `fontFamily.display`
- `src/index.css`: Update heading font-family rule, add `--font-weight-regular: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600` tokens, standardize type scale (H1 28-32px, H2 20-24px, Body 16px, Small 13-14px, line-height 1.25 for body)

### 2. Color Palette Refinement

**Current issue**: Borders are explicit; palette lacks warm neutrals. The brief calls for tonal shifts instead of borders, warm off-white surfaces, and muted success/caution accents.

**Changes to `src/index.css`**:
- Light mode: softer warm background (`--background`), reduce border visibility, add `--success` (muted green) and `--caution` (muted amber) tokens
- Dark mode: align with same tonal approach
- Remove emoji background texture from home (brief says "don't use heavy decorative textures")
- Reduce explicit border usage across components in favor of subtle elevation/tonal shifts

### 3. Home Screen

**File**: `src/pages/Index.tsx`

- Remove the 200-emoji texture background
- Increase card spacing and use soft shadows instead of borders (`shadow-sm` with no visible border, or very faint `border-border/50`)
- Add `whileTap: { scale: 0.96 }` already present — good
- Title: drop the split-word color trick for a cleaner single-treatment heading

### 4. Chip Component Refinement

**File**: `src/components/mealplan/ConsiderationsScreen.tsx`

- Increase chip touch target to min 44px height
- Use tonal background shifts for selected state instead of hard `bg-primary` fill (softer: `bg-primary/10 text-primary border-primary/30`)
- Consistent pill radius (`rounded-full` already used)

### 5. Card & Elevation System

**Files**: Multiple components

- Replace `border border-border` pattern with `shadow-sm` and very subtle/no border
- Use `rounded-xl` (12px) consistently for cards
- Meal cards in results: add slight hover elevation transition
- SwipeCard: soften the SAVE/NOPE overlay badges (reduce font weight, use softer colors)

### 6. Microinteractions

**File**: `tailwind.config.ts` + component files

- Add button press keyframe: `scale(0.96)` + color fade at 120ms
- Card expand: ensure 300ms ease-out for accordion/collapsible content
- Keep durations 120-250ms for hover/press
- Add `@media (prefers-reduced-motion: reduce)` rule to disable animations
- Add motion toggle in a future settings screen (noted, not built now)

### 7. Spacing & Layout Density

- Increase container padding from `px-4` to `px-5` or `px-6` on key screens
- Add more vertical breathing room between sections in ConsiderationsScreen
- Meal plan results: slightly increase card internal padding

### 8. Accessibility

- Ensure all chips have min 44px touch target (currently `py-1.5` = ~30px — needs `py-2.5` or `min-h-[44px]`)
- Add visible focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to Chip component and all custom buttons
- Check and fix contrast on muted text colors
- Add `aria-label` to icon-only buttons that lack them

### 9. Microcopy Tone

**File**: `src/lib/i18n.tsx`

- Soften language per brief examples (e.g., section subtitles, button labels)
- Keep short, actionable, warm

---

### Files to modify

| File | Changes |
|---|---|
| `index.html` | Update Google Fonts |
| `src/index.css` | New type scale, weight tokens, color tweaks, reduced-motion media query, remove hard borders default |
| `tailwind.config.ts` | Update display font, add success/caution colors, button-press keyframe |
| `src/pages/Index.tsx` | Remove emoji texture, cleaner card styling, simpler title |
| `src/components/mealplan/ConsiderationsScreen.tsx` | Chip sizing (44px targets), focus styles, tonal selected state, spacing |
| `src/components/mealplan/MealPlanResults.tsx` | Card elevation, spacing, softer borders |
| `src/components/quiz/CravingStep.tsx` | Card styling alignment, touch targets |
| `src/components/quiz/FlavorStep.tsx` | Chip touch targets, focus styles |
| `src/components/quiz/SwipeCard.tsx` | Softer overlay badges |
| `src/components/quiz/ResultsScreen.tsx` | Spacing, button styling |
| `src/components/scan/FridgeScanner.tsx` | Spacing, card styling |
| `src/components/mealplan/SwapDialog.tsx` | Touch targets, focus styles |
| `src/lib/i18n.tsx` | Microcopy refinements |

