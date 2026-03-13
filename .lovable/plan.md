

## Improve Loading Experience for Meal Plan Generation

### Changes

**1. Estimated time display + explanatory steps** (`PlateLoader.tsx`)
- Show estimated time based on duration: 1-day ~20s, 3-day ~30s, 7-day ~50s, 30-day ~3min
- Add a live countdown/elapsed timer
- Show step-by-step explanation: "Crafting recipes → Building grocery list → Finalising plan"
- Replace generic delay-phase messages with duration-aware messaging

**2. Progressive results — show days as they arrive** (`MealPlanContext.tsx`, `MealPlanFlow.tsx`, `MealPlanResults.tsx`)
- Instead of waiting for the entire plan (all chunks + grocery list), transition to results view as soon as the first chunk arrives
- Store partial plan data and update it as more SSE events come in
- The grocery list tab shows a "Building..." state until the final `complete` event
- This makes 7-day and 30-day plans feel dramatically faster — user sees Day 1-4 meals within ~30s

**3. Browser notification option** (`PlateLoader.tsx`)
- Add a "Notify me when ready" button that requests `Notification.permission`
- When the plan completes, fire a browser notification if the tab is not focused
- Store preference so it auto-enables next time

### Files to Change

- **`src/components/ui/PlateLoader.tsx`** — Add duration prop, estimated time display, elapsed timer, step descriptions, notify button
- **`src/components/mealplan/MealPlanContext.tsx`** — Emit partial plan data from SSE progress events; add `partialDays` to state; transition to results early on first chunk
- **`src/components/mealplan/MealPlanFlow.tsx`** — Pass duration to PlateLoader; handle partial results state
- **`src/components/mealplan/MealPlanResults.tsx`** — Handle partial state: show available days, show grocery tab as loading until complete
- **`src/lib/i18n.tsx`** — Add new translation keys for estimated time, step explanations, notify button text
- **`supabase/functions/generate-meal-plan/index.ts`** — Send `chunk_days` data in SSE progress events (the actual days from each chunk) so the client can render them immediately, instead of only sending them all at `complete`

### How Progressive Results Work

```text
SSE stream timeline (7-day plan):
  t=0s   → progress: "Generating days 1-4..."
  t=25s  → chunk_ready: { days: [day1,day2,day3,day4] }  ← client shows results
  t=25s  → progress: "Generating days 5-7..."
  t=45s  → chunk_ready: { days: [day5,day6,day7] }       ← appended to results  
  t=45s  → progress: "Building grocery list..."
  t=55s  → complete: { groceryList, costSummary }         ← grocery tab ready
```

The edge function sends a new `chunk_ready` event with partial days after each chunk completes. The client transitions from loading → results on the first `chunk_ready`, then appends subsequent chunks. The `complete` event delivers the grocery list and cost summary.

