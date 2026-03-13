

## Fix Grocery List Copy Bugs

### Bug 1: Redundant quantity + unit ("5 pieces pcs")
The display concatenates `totalQuantity` and `unit` blindly. When the AI includes the unit inside `totalQuantity` (e.g. "5 pieces"), appending `unit` ("pcs") creates redundancy.

**Fix in `MealPlanResults.tsx` and `SavedPlanView.tsx`:**
- Add a helper that checks if `totalQuantity` already contains the `unit` string (case-insensitive) and skips appending it
- Apply to both files' grocery display sections

### Bug 2: "stories" in recipe names  
The `recipesUsedIn` values come from AI-generated recipe names. The AI is producing names like "Akara and Pap stories" instead of proper recipe names. This is a prompt issue in the edge function.

**Fix in `supabase/functions/generate-meal-plan/index.ts`:**
- Add clearer instructions in the system prompt that recipe names should be simple, descriptive names (e.g. "Akara and Pap", "Moin Moin Breakfast") — not narratives or "stories"
- Add a description to the `recipesUsedIn` schema field: "Array of recipe names this ingredient is used in. Use the exact meal name from the days array."

### Files changed
- `src/components/mealplan/MealPlanResults.tsx` — smart unit display
- `src/components/mealplan/SavedPlanView.tsx` — same fix
- `supabase/functions/generate-meal-plan/index.ts` — prompt clarification for recipe names

