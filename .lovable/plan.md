## Goal

Replace the current `src/components/ui/sonner.tsx` with the new shadcn **base sonner** design: a minimal Toaster that themes via CSS variables (instead of heavy `classNames` overrides) and uses lucide icons for success / info / warning / error / loading toast types.

## What changes

### `src/components/ui/sonner.tsx`

Rewrite the Toaster:

- Drop the `classNames` override block (`group-[.toaster]:bg-background ...`).
- Style via CSS variables on `style`:
  - `--normal-bg: var(--popover)`
  - `--normal-text: var(--popover-foreground)`
  - `--normal-border: var(--border)`
  - `--border-radius: var(--radius)`
- Pass an `icons` prop with lucide icons:
  - `success` → `CircleCheckIcon` (text-success / emerald)
  - `info` → `InfoIcon`
  - `warning` → `TriangleAlertIcon` (text-caution)
  - `error` → `OctagonXIcon` (text-destructive)
  - `loading` → `Loader2Icon` with `animate-spin`
- Keep our project-specific behaviour:
  - `position="bottom-center"`
  - `offset={80}` (clears the bottom nav — per project memory)
  - `closeButton`
  - Centering wrapper style (`left: 50%`, `transform: translateX(-50%)`)
- Re-export `toast` from `sonner` as today so no call site changes.

### No other files change

All 14 existing `toast.success / error / info` call sites (FridgeScanner, MealPlanResults, MealPlanContext, ResultsScreen, BottomNav) keep working — they automatically pick up the new look and icons.

## Technical notes

- The new design relies on sonner reading `--normal-bg / --normal-text / --normal-border / --border-radius` from the Toaster's inline style. `--popover`, `--popover-foreground`, `--border`, `--radius` are all already defined in `src/index.css` via the shadcn theme, so light/dark mode keep working through `next-themes`.
- The `rounded-xl` shape we have today is preserved because `--radius` in the project resolves to ~12px (matches the project's 12px radius rule).
- Success/error/warning icons will inherit color from sonner's defaults; if we want to tint them to our semantic tokens (`text-success`, `text-caution`, `text-destructive`) we apply `className` directly on each lucide icon element in the `icons` map.
- `position` and `offset` stay on the Toaster so toasts continue to sit above the 56px bottom nav + safe-area inset.

## Out of scope

- No changes to individual `toast.*` calls.
- No changes to durations (5s success / 10s error stay as set per call site, per project memory).
- No new dependencies — `sonner`, `lucide-react`, `next-themes` are already installed.
