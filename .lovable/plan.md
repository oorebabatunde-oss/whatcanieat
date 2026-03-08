

## Problem

When you click "Find my craving," the quiz jumps straight to the results screen because sessionStorage still holds the previous quiz state (with `step: 4`). The `QuizProvider` loads this stale state on mount, skipping all intermediate steps.

## Root Cause

In `QuizContext.tsx`, `loadState()` reads from sessionStorage on mount. If you previously completed the quiz, `step` is `4`, so it renders `ResultsScreen` immediately. There is no mechanism to reset the quiz when re-entering quiz mode from the welcome screen.

## Fix

**File: `src/pages/Index.tsx`**

When the user clicks "Find my craving" (switching to quiz mode), clear the quiz sessionStorage key (`quiz-state`) so the quiz always starts fresh from step 0.

```ts
const changeMode = (m: AppMode) => {
  if (m === "quiz") {
    sessionStorage.removeItem("quiz-state"); // reset quiz on re-entry
  }
  sessionStorage.setItem(MODE_KEY, m);
  setMode(m);
};
```

This is a one-line addition. The quiz will still persist state mid-session (e.g., if the user navigates to auth and back), but starting a new quiz from the welcome screen will always begin at step 0.

