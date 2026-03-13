

## Fix: Wrong Duration Sent + Missing Days

### Root Cause Analysis

**Bug 1: "Generating your 3 day plan" despite selecting 7 days**
Classic React stale closure. In `ConsiderationsScreen.tsx` line 117-121:
```js
const handleGenerate = () => {
  setConsiderations(local);
  setDuration(dur);    // queues state update
  generatePlan();      // reads state.duration → still 3 (default)
};
```
`generatePlan` (line 220-253 in MealPlanContext) reads `state.duration` and `state.considerations` from the closure, which haven't updated yet. So it sends `duration=3` to the server regardless of what the user selected.

**Bug 2: Only days 5-7 displayed**
After `callGeneratePlan` returns, lines 245-248 trim the plan:
```js
if (plan.days && plan.days.length > state.duration) {
  plan.days = plan.days.slice(0, state.duration);  // state.duration is stale (3)
}
```
If the server happened to return 7 days (e.g. from a retry where sessionStorage had the correct value), this trims to 3 days. Combined with progressive `onChunkReady`/`onComplete` race conditions, this creates inconsistent display.

### Fix

**`src/components/mealplan/MealPlanContext.tsx`**
1. Change `generatePlan` to accept `duration` and `considerations` as parameters instead of reading from stale closure
2. Remove the redundant post-call trimming (lines 245-248) — the server already enforces correct day count
3. Remove the redundant final `setState` at line 248 — `onComplete` already handles this

**`src/components/mealplan/ConsiderationsScreen.tsx`**
1. Pass `dur` and `local` directly to `generatePlan(dur, local)` so values are captured at call time

This is a 2-file fix addressing both bugs with a single root cause.

