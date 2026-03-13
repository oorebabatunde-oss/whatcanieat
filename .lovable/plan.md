

## Add Budget Time Period

Add a "per" period selector (day/week/month) to the budget input so it reads as e.g. "£ 50 per week".

### Changes

**1. `src/components/mealplan/MealPlanContext.tsx`**
- Update the `budget` type from `{ amount: number; currency: string }` to `{ amount: number; currency: string; period: "day" | "week" | "month" }`
- Default period to `"week"` where budget objects are created

**2. `src/components/mealplan/ConsiderationsScreen.tsx`**
- After the amount input, add a row of period chips: "per day", "per week", "per month"
- Wire the chips to set `local.practical.budget.period`
- Layout: currency chips + amount input on one line, period chips on the next line (or inline with "per" label)

**3. `supabase/functions/generate-meal-plan/index.ts`**
- Pass the budget period to the AI prompt so it interprets the amount correctly (e.g. "Budget: £50 per week")
- The AI will scale costs accordingly for the plan duration

**4. `src/lib/i18n.tsx`**
- Add keys: `mealplan.budget.per`, `mealplan.budget.day`, `mealplan.budget.week`, `mealplan.budget.month`

