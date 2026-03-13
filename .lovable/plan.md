

## Meal Planning Feature — Full Implementation Plan

This builds the complete meal planning feature: a considerations input screen, AI-powered plan generation via edge function, results view with swap/regenerate, and integration into the welcome screen. The previously built save/view infrastructure (`useSaveMealPlan`, `SavedPlanView`, `SavedMealPlans`) will be connected.

### New Files

**1. `supabase/functions/generate-meal-plan/index.ts`** — Edge function
- Accepts: `{ considerations: { safety, practical, preferences, nuance }, duration: 1|3|7, swap?: { mealId, type, currentPlan } }`
- Uses Lovable AI (`google/gemini-3-flash-preview`) with tool calling to return structured JSON matching the existing `PlanData` interface in `SavedPlanView.tsx`
- System prompt encodes all generation rules (priority order, nutrition baseline, capsule meals, cost optimisation, failure handling)
- Reuses CORS pattern, rate limiting, and JWT decode from `recommend/index.ts`
- Tool schema enforces: `{ days[], groceryList[], costSummary, nutritionNotes[], conflicts[] }`
- Swap requests send the current plan + swap instruction, returning a modified plan

**2. `src/components/mealplan/MealPlanContext.tsx`** — State management
- Mirrors `QuizContext.tsx` pattern with sessionStorage persistence
- State: `{ step: "considerations"|"loading"|"results", considerations, duration, planData, error }`
- Actions: `setConsiderations`, `setDuration`, `generatePlan`, `swapMeal`, `regenerate`, `reset`

**3. `src/components/mealplan/ConsiderationsScreen.tsx`** — Single-page input
- Three collapsible sections using existing `Collapsible` component:
  - **Safety**: Chip toggles for allergies, diabetes-friendly, pregnancy-safe, PCOS-friendly, gluten-free, dairy-free, vegan, vegetarian, religious restrictions, ingredient exclusions
  - **Practical**: Budget (3 chips), max prep time (slider/chips), meals per day (1-5 stepper), cooking skill (3 chips), equipment (multi-select chips), cooking pattern (3 chips), storage (3 chips), family size (1-6 stepper)
  - **Preferences**: Chip toggles for high protein, low carb, high fibre, cheap, simple, familiar, variety, spicy, comfort food, quick snacks
- Free-text nuance field at bottom
- Day duration toggle (1/3/7) 
- "Generate Plan" button
- Non-judgmental tone in all labels

**4. `src/components/mealplan/MealPlanResults.tsx`** — Results view
- Tabs: Meals | Grocery List (reuses patterns from `SavedPlanView.tsx`)
- Each meal card: expandable with recipe, ingredients, steps, substitutions, prep time, cost
- **Swap button** per meal → opens `SwapDialog` with options: cheaper, faster, similar, remove ingredient
- **Save Plan** button using `useSaveMealPlan` hook
- **Regenerate** and **Adjust Constraints** buttons
- Conflict warnings displayed if AI returns them
- Loading state with animated placeholder

**5. `src/components/mealplan/SwapDialog.tsx`** — Swap options dialog
- Uses existing `Dialog` component
- Four swap options: cheaper, faster, similar, remove ingredient (with ingredient picker)
- Triggers re-call to edge function with swap parameters
- Replaces single meal in current plan

**6. `src/components/mealplan/MealPlanFlow.tsx`** — Orchestrator
- Renders ConsiderationsScreen → loading → MealPlanResults based on context step
- Wraps in `MealPlanProvider`

### Modified Files

**7. `src/pages/Index.tsx`**
- Add `"mealplan"` to `AppMode` type
- Add third button card on welcome screen: 📋 "Plan my meals" / subtext about constraints
- Render `MealPlanFlow` when mode is `"mealplan"`
- Widen `max-w` from `18rem` to `28rem`, show 3 cards in a row

**8. `supabase/config.toml`**
- Add `[functions.generate-meal-plan]` with `verify_jwt = false`

**9. `src/lib/i18n.tsx`**
- Add English keys for all meal plan UI strings (~40 keys covering considerations labels, section headers, button text, swap options, grocery categories)
- Other languages get basic translations

### Edge Function AI Prompt Design

The system prompt will enforce:
1. Safety compliance (never violate allergies/restrictions)
2. Practical fit (respect budget, time, equipment, skill)
3. Preference alignment (soft scoring)
4. Nutrition baseline (protein + fibre + plant + fat daily)
5. Ingredient reuse across meals
6. Cost efficiency
7. Variety (no repeated meals)
8. Capsule meal ratio when specified
9. Clear, simple language in steps
10. Conflict detection with relaxation suggestions

Tool calling schema ensures structured output matching the `PlanData` interface.

### Implementation Order

1. Edge function (`generate-meal-plan`)
2. `MealPlanContext` + `ConsiderationsScreen`
3. `MealPlanResults` (reusing `SavedPlanView` patterns)
4. `SwapDialog`
5. `MealPlanFlow` orchestrator
6. Welcome screen integration (`Index.tsx`)
7. Config + i18n updates

