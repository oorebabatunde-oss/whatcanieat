

## What's broken

Two issues identified from the logs:

### 1. 7-day meal plan times out (primary issue)
The edge function has a 120-second timeout (`AbortSignal.timeout(120_000)`), but generating a 7-day plan with full tool-call schema (21 meals, grocery list, steps, substitutions) exceeds that. The logs confirm: `Signal timed out` after 120s → returns 500.

**Fix**: Use `google/gemini-2.5-flash` instead of `google/gemini-3-flash-preview` — it's faster and more reliable for large structured outputs. Also increase timeout to 180s, and for 7+ day plans, simplify the prompt to reduce output size (e.g., shorter step descriptions, fewer substitutions).

### 2. React ref warning on `Section` component (minor)
The `Section` function component in `ConsiderationsScreen.tsx` is passed to `CollapsibleTrigger asChild` pattern indirectly — but the warning says refs can't be given to function components. This is a non-breaking warning but should be cleaned up.

**Fix**: The `Section` component itself isn't the issue — it uses `<button>` inside `asChild`. The warning likely comes from `motion.div` wrapping `Section`. This is cosmetic and non-blocking.

---

## Plan

### 1. Fix 7-day timeout (edge function)
**File**: `supabase/functions/generate-meal-plan/index.ts`

- Switch model to `google/gemini-2.5-flash` (faster, better for structured output)
- Increase timeout from 120s to 180s
- For durations ≥ 7 days, add prompt instruction to keep steps concise (max 4 steps per recipe) and skip substitutions to reduce token output size

### 2. Fix Section ref warning (minor cleanup)
**File**: `src/components/mealplan/ConsiderationsScreen.tsx`

- Wrap `Section` with `React.forwardRef` to suppress the warning

