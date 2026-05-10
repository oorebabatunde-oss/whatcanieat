## Saved meal plans: grocery checkboxes + naming/renaming

Two related improvements to saved meal plans.

### 1. Grocery list checkboxes in saved view

`src/components/mealplan/SavedPlanView.tsx` currently renders the grocery tab as plain rows. Bring it in line with `MealPlanResults.tsx`:

- Add a `checkedItems: Set<string>` state and a `toggleGroceryItem` handler.
- Render a `<Checkbox>` (from `@/components/ui/checkbox`) on each grocery row, with `line-through opacity-50` styling when checked.
- Show a `{checked} / {total}` counter above the list (reusing the `mealplan.groceryChecked` translation key).
- Persist checked state per saved plan in `localStorage` under `grocery-checked-{plan.id}` so progress survives navigation/refresh. (No DB changes — grocery checkmarks are ephemeral shopping state, not plan content.)

### 2. Name and rename meal plans

**At save time** (`src/hooks/useSaveMealPlan.ts` + caller in `MealPlanResults.tsx`):
- Replace the auto-generated name with a prompt/dialog asking the user for a name, pre-filled with the current default `"{duration}-Day Plan — {date}"`.
- Use a small shadcn `Dialog` with an `Input` + Save/Cancel rather than a native `prompt()` for consistency with the app's design system.
- If the user clears the field, fall back to the default.

**Rename existing plans** (`src/components/saved/SavedMealPlans.tsx`):
- Add a pencil/edit icon button next to the trash icon on each saved plan row.
- Tapping it opens the same naming dialog pre-filled with the current name.
- On save:
  - Authenticated users: `UPDATE saved_meal_plans SET name = ... WHERE id = ...` via Supabase.
  - Guests: update the entry inside `localStorage["guest_saved_meal_plans"]`.
- Update local `plans` state optimistically.

### Database change required

The `saved_meal_plans` table currently has no UPDATE RLS policy (users can only insert/select/delete their own). To allow renaming for signed-in users, add:

```sql
CREATE POLICY "Users can update own meal plans"
ON public.saved_meal_plans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### i18n

Add new keys (translated across all 14 languages, mirroring existing `saved.*` / `mealplan.*` patterns):
- `mealplan.namePlanTitle` ("Name your meal plan")
- `mealplan.namePlanPlaceholder` ("e.g. Weekday lunches")
- `saved.renamePlan` ("Rename")
- `common.save`, `common.cancel` (if not already present)

### Out of scope

- No changes to meal-plan generation, grocery data shape, or the recommendations tab.
- Checked grocery state is local-only; not synced across devices.
