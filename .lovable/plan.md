# Align H1 per flow and rework Home / Back navigation

## Goals

1. Each flow (quiz, scan, meal plan) gets its own meaningful H1 instead of the generic "What Can I Eat?" repeated everywhere — better for SEO and screen readers.
2. The bottom-nav **Home** button no longer destroys an in-progress journey. If the user is mid-flow, tapping Home brings them back into that flow (preserving their progress). A new **back arrow** in the flow header lets them intentionally exit to the welcome screen.

## Behaviour changes

### Bottom-nav Home button
- Currently: clears `app-mode` + `quiz-state` and dispatches `go-home`, wiping any in-progress journey.
- New: just navigates to `/`. The Index page reads `sessionStorage` and restores whichever flow was active (it already does this on mount). So if a user is mid–meal-plan, taps Saved, then taps Home, they land back inside the meal plan where they left off.
- The destructive reset only happens when the user explicitly taps the new back arrow in the flow header.

### Per-flow header (Index.tsx)
Each flow gets a header with:
- A back-arrow button on the left → calls `goWelcome()` (which clears the flow state and returns to the welcome screen)
- A flow-specific H1 in the center

H1 text per flow (added to `src/lib/i18n.tsx` under existing `quiz`/`scan`/`mealplan` namespaces):

| Flow | H1 key | English copy |
|------|--------|--------------|
| Welcome | (existing) | What Can I Eat? |
| Quiz | `quiz.headerTitle` | Food Quiz |
| Scan | `scan.headerTitle` | Scan Your Fridge |
| Meal plan | `mealplan.headerTitle` | Meal Plan |
| Saved | (existing "Saved") | Saved |
| Auth | (existing) | Sign in |

The header H1 stays small (matches current `text-xl font-display`) so it doesn't overpower the flow content. The welcome page keeps its large hero H1 unchanged.

### Scan flow
`FridgeScanner` currently renders its own header with the app title that calls `onBack`. Update it to:
- Show a back arrow on the left (calls `onBack`)
- Show H1 "Scan Your Fridge" centered

The two existing `t("scan.backHome")` text-button instances inside the results view stay as they are (they're convenience buttons, not the primary back affordance).

## Files to change

- **`src/pages/Index.tsx`** — extract a small `FlowHeader` component (back arrow + centered H1) and use it for the quiz and meal-plan modes. Remove the clickable app-title H1 in those headers.
- **`src/components/scan/FridgeScanner.tsx`** — replace the title-as-back-button with a `FlowHeader` (back arrow + "Scan Your Fridge" H1).
- **`src/components/BottomNav.tsx`** — Home tab: drop the `sessionStorage.removeItem` calls and the `go-home` event dispatch; just `navigate("/")`.
- **`src/pages/Index.tsx`** — remove the now-unused `go-home` event listener.
- **`src/lib/i18n.tsx`** — add `quiz.headerTitle`, `scan.headerTitle`, `mealplan.headerTitle` keys for all 14 supported languages.

## Header layout

```text
[← back]        Food Quiz                    
─────────────────────────────────────────────
                  (flow content)
```

The back arrow uses `ArrowLeft` from `lucide-react` (already imported in FridgeScanner). 44px tap target, `aria-label` set from a new `common.back` key.
