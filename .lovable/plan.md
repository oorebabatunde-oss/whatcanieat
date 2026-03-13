

## Plan: Save Meal Plans + Unified Saved Page

### Overview

Add the ability to save generated meal plans, and update the Saved page to show both saved food recommendations and saved meal plans in a tabbed interface.

### Database Changes

**New table: `saved_meal_plans`**

```sql
CREATE TABLE public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,              -- e.g. "3-Day Plan — Mar 13"
  plan_data jsonb NOT NULL,        -- full plan JSON (days, meals, recipes, grocery list)
  considerations jsonb,            -- the constraints used to generate it
  duration integer NOT NULL DEFAULT 3  -- 1, 3, or 7
);

ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can CRUD their own plans
CREATE POLICY "Users can view own meal plans" ON public.saved_meal_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON public.saved_meal_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON public.saved_meal_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### Frontend Changes

**1. Meal Plan Results — Add "Save Plan" button**

In `MealPlanResults.tsx` (to be built as part of the meal plan feature):
- Add a "Save Plan" button in the results header
- Authenticated users: insert into `saved_meal_plans` with full plan JSON
- Guest users: save to `localStorage` key `guest_saved_meal_plans`
- Show toast on save, disable button if already saved

**2. Saved Page — Tabbed layout**

Update `src/pages/Saved.tsx`:
- Add two tabs: "Recommendations" and "Meal Plans" using existing Tabs component
- **Recommendations tab**: Current card list (unchanged)
- **Meal Plans tab**: List of saved plans showing name, date, duration badge, delete button
  - Clicking a saved plan expands/navigates to show the full plan (days, recipes, grocery list) reusing `MealPlanResults` in read-only mode

**3. Saved Plan Detail View**

Create `src/components/mealplan/SavedPlanView.tsx`:
- Renders a saved plan's data (reuses RecipeCard, GroceryList components)
- Back button returns to saved list
- Delete button removes from DB/localStorage

**4. Guest localStorage support**

- Mirror the existing `guest_saved_recommendations` pattern with `guest_saved_meal_plans`
- Same guest warning banner applies to both tabs

**5. i18n additions**

Add keys: `saved.tabs.recommendations`, `saved.tabs.mealPlans`, `saved.savePlan`, `saved.planSaved`, `saved.planDuration` (English, other languages incrementally)

### Implementation Order

1. Database migration (new table + RLS)
2. Save plan logic in MealPlanResults (button + insert/localStorage)
3. Update Saved page with tabs
4. Saved plan detail/expand view
5. i18n strings

