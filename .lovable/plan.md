

## Bug Fix Plan: 14 QA Issues

### 1. Hardcoded subtitle not translated
**File:** `src/pages/Index.tsx` line 135
The string `"Figure out what to eat — no stress."` is hardcoded. Replace with `t("home.subtitle")` and add the translation key to all 14 languages in `src/lib/i18n.tsx`.

### 2. PlateLoader step labels reference meal plan in all journeys
**File:** `src/components/ui/PlateLoader.tsx`
The `getStepLabel()` function references "Setting up your plan", "Crafting recipes", "Building grocery list" even when used by quiz/fridge scanner. Add a `variant` prop (`"mealplan" | "craving" | "scan"`) that controls which step labels are shown. Add new i18n keys for craving/scan loading steps (e.g. "Finding dishes...", "Analyzing ingredients..."). Update callers in `ResultsScreen.tsx`, `FridgeScanner.tsx`, and `MealPlanFlow.tsx` to pass the appropriate variant. Also hide the progress bar, time estimate, chunk explanation, and notify button for non-mealplan variants (those are short operations).

### 3. Duration selector has no label
**File:** `src/components/mealplan/ConsiderationsScreen.tsx` line 342
Add a label above the duration buttons: `<p className="text-body-xs font-medium text-foreground mb-1.5">{t("mealplan.planDurationLabel")}</p>`. Add `"mealplan.planDurationLabel": "Plan duration"` (and translations) to i18n.

### 4. "Error in input stream" during grocery list generation
**File:** `supabase/functions/generate-meal-plan/index.ts`
This is an intermittent LLM streaming error. Add retry logic around the grocery list generation call (the final step after all chunks). If the grocery list call fails, retry once before propagating the error. Review the existing retry mechanism to ensure it covers the grocery generation step specifically.

### 5. Buttons/cards glitchy on page load
**File:** `src/pages/Index.tsx`
The `motion.button` cards use `initial={{ opacity: 0, y: 16 }}` with staggered delays. On fast loads this can cause a flash. Add `layout` prop and use `will-change: transform` CSS hint. Alternatively, reduce delays slightly and ensure the parent `motion.div` also coordinates entry. This may also be caused by `glass-card` styles loading late — verify `glass-card` is defined in `index.css` and not dynamically loaded.

### 6. Swap button disabled during generation — no user communication
**File:** `src/components/mealplan/MealPlanResults.tsx` line 156-164
The swap button is already `disabled={!isComplete}` but has no tooltip or explanation. Add a tooltip or small text beneath when `!isComplete`: something like "Available once plan is complete". Add i18n key `"mealplan.swapDisabled"`.

### 7. Notify button cross-browser issues
**File:** `src/components/ui/PlateLoader.tsx` line 106
The check `"Notification" in (typeof window !== "undefined" ? window : {})` is problematic. Safari may not expose `Notification` in some contexts, and the JSX conditional rendering with `&&` may produce unexpected results. Replace with a state-based check using `useEffect` to detect notification support on mount, and render the button conditionally from that state. Also ensure the button has proper `type="button"`.

### 8. Intermittent "No plan received"
**File:** `src/components/mealplan/MealPlanContext.tsx` line 190
The SSE reader may miss the `complete` event if the last chunk doesn't end with a newline. After the `while` loop exits, process any remaining `buffer` content before checking `if (!plan)`. This handles edge cases where the final SSE line isn't terminated.

### 9. "New plan" reloads entire website
**File:** `src/components/mealplan/MealPlanResults.tsx` line 91
Currently: `sessionStorage.clear(); window.location.reload();`. This clears ALL session storage and reloads. Instead, use the `reset()` function from `MealPlanContext` which already clears the meal plan state and returns to considerations. Change to call `reset()` directly.

### 10. Language change doesn't update generated content
This is expected — AI-generated content (dish names, recipes) is rendered as plain strings, not i18n keys. Add a note/toast informing users that already-generated content won't change language. Add i18n key `"lang.generatedContentNote"`. Show this as a small disclaimer when language is changed while results are visible.

### 11. Network failure error messages too vague
**File:** `src/components/mealplan/MealPlanContext.tsx`
In the `catch` blocks, differentiate between network errors (`TypeError: Failed to fetch`) and API errors. Show more specific messages: "Network error — check your connection and try again" vs "Generation failed — please try again". Add i18n keys for these error types. Also add a "Retry" button on the error state in `ConsiderationsScreen.tsx`.

### 12. Toasts persist without dismiss option
**File:** `src/hooks/use-toast.ts` line 7
`TOAST_REMOVE_DELAY` is set to `1000000` (16+ minutes). Change to `5000` (5 seconds). The `ToastClose` component already renders an X button in `toaster.tsx`, so toasts should already be dismissable — verify the close button is visible. For `sonner` toasts, they auto-dismiss by default.

### 13. Rejected craving animation loops (swipes left then right)
**File:** `src/components/quiz/SwipeCard.tsx` line 70
The `exit` animation is `{ x: 300, opacity: 0 }` — this swipes RIGHT for all exits (including rejects). The exit direction should depend on the swipe action. Pass a `swipeDirection` prop or use a shared state. For left swipes, exit should be `{ x: -300, opacity: 0 }`. Update `ResultsScreen.tsx` to track the last swipe direction and pass it to `SwipeCard`.

### 14. Grocery list "units items" redundancy
**File:** `supabase/functions/generate-meal-plan/index.ts`
The prompt already has naming fixes. Strengthen the grocery list prompt to say: "For the `unit` field, use standard units like 'g', 'ml', 'kg', 'L', 'pcs'. Never use 'units', 'items', 'unit items'. If an item is counted individually (e.g. bananas, eggs), use 'pcs' as the unit and put just the number in totalQuantity." The client-side dedup logic already handles some cases but the root cause is the AI output.

### Files to modify
- `src/pages/Index.tsx` — #1, #5
- `src/lib/i18n.tsx` — #1, #2, #3, #6, #10, #11 (new keys in all 14 languages)
- `src/components/ui/PlateLoader.tsx` — #2, #7
- `src/components/quiz/ResultsScreen.tsx` — #2, #13
- `src/components/scan/FridgeScanner.tsx` — #2
- `src/components/mealplan/MealPlanFlow.tsx` — #2
- `src/components/mealplan/ConsiderationsScreen.tsx` — #3, #11
- `src/components/mealplan/MealPlanResults.tsx` — #6, #9
- `src/components/mealplan/MealPlanContext.tsx` — #8, #11
- `src/components/quiz/SwipeCard.tsx` — #13
- `src/hooks/use-toast.ts` — #12
- `supabase/functions/generate-meal-plan/index.ts` — #4, #14

