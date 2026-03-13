

## Redesign All Loading States with Plate + Food Emoji Animation

### What we're building
A fun, branded loading animation across all three flows (quiz results, meal plan generation, fridge scanner) showing a plate emoji with food items being placed on it in a loop. After 5 seconds, a secondary message appears: "Almost there. Still working."

### Loading animation design
- A 🍽️ plate emoji (large, centered) with food emojis (🥗🍕🍜🧁🥑🍔🌮🥘🍣) cycling one-by-one, fading/scaling in above the plate then settling, looping through the set
- CSS keyframe animation: each food emoji fades in, floats down onto the plate, then fades out before the next one appears
- After 5 seconds, a `useState` timer triggers "Almost there. Still working." text below

### Implementation

**1. New shared component: `src/components/ui/PlateLoader.tsx`**
- Accepts optional `message` prop for the primary loading text
- Renders a large plate emoji centered, with an animated food emoji cycling above it using `useState` + `useEffect` interval (swap food emoji every ~800ms)
- Each food emoji animates in with scale+fade using framer-motion `AnimatePresence` + `key`
- After 5s (`useEffect` with timeout), shows secondary text "Almost there. Still working." with fade-in
- Add i18n key `loading.almostThere` for the delayed message

**2. Update loading states in 3 files:**

- **`src/components/mealplan/MealPlanFlow.tsx`** (line 13-22): Replace `Loader2` spinner with `<PlateLoader message={t("mealplan.generating")} />`
- **`src/components/quiz/ResultsScreen.tsx`** (around line 214-217): Replace `Loader2` spinner with `<PlateLoader message={t("results.loading.subtitle")} />`
- **`src/components/scan/FridgeScanner.tsx`** (lines 217-221 and 266-270): Replace both `Loader2` spinners with `<PlateLoader message={t("scan.identifying")} />`

**3. Add i18n key** in `src/lib/i18n.tsx`:
- `loading.almostThere` → "Almost there. Still working." (+ translations for all 9 languages)

### Files changed
- `src/components/ui/PlateLoader.tsx` (new)
- `src/components/mealplan/MealPlanFlow.tsx`
- `src/components/quiz/ResultsScreen.tsx`
- `src/components/scan/FridgeScanner.tsx`
- `src/lib/i18n.tsx`

