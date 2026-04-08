

# Fix Plan: 4 Issues — Home Button, Checkbox, Install CTA, Snackbar Position

## 1. Home button doesn't work during a journey

**Root cause:** The Home tab in `BottomNav.tsx` calls `navigate("/")` which changes the URL, but `Index.tsx` manages its own state via `useState<AppMode>` initialized from `sessionStorage`. Navigating to `/` doesn't reset the mode back to `"welcome"` — the user stays stuck in the quiz/scan/mealplan view.

**Fix:** In the Home tab action, also clear the `sessionStorage` keys (`app-mode`, `quiz-state`) so that when the page re-renders, `loadMode()` returns `"welcome"`. Additionally, force a state reset by either:
- Dispatching a custom event that `Index.tsx` listens for, OR
- Simpler: clear sessionStorage and use `navigate("/", { replace: true })` combined with `window.location.reload()` — but that's heavy.
- Best approach: clear sessionStorage and use a key-based remount by adding a `key` prop derived from a counter/state to the `Index` route, or use `useSearchParams`/`useNavigate` state to signal a reset. Simplest: clear sessionStorage + call `window.dispatchEvent(new Event("go-home"))` and listen for it in `Index.tsx` to call `changeMode("welcome")`.

**Files:** `src/components/BottomNav.tsx`, `src/pages/Index.tsx`

## 2. Checkbox doesn't respond to direct taps

**Root cause:** In `MealPlanResults.tsx` line 233-234, the parent `<div>` has `onClick={() => toggleGroceryItem(itemKey)}` and the `<Checkbox>` also has `onCheckedChange={() => toggleGroceryItem(itemKey)}`. When tapping the checkbox directly, both fire (event bubbles from checkbox to parent div), toggling the item twice — so it checks then immediately unchecks.

**Fix:** Remove the `onCheckedChange` handler from `<Checkbox>` since the parent div's `onClick` already handles it. Or alternatively, stop propagation in the checkbox handler. Simplest: remove `onCheckedChange` from Checkbox and let the row click handle everything, keeping Checkbox as display-only (`checked={isChecked}` with `pointer-events-none`).

**File:** `src/components/mealplan/MealPlanResults.tsx`

## 3. No CTA to download/install app

**Root cause:** The `InstallButton` component uses `useState` instead of `useEffect` to listen for `beforeinstallprompt`, so the event listener is never properly set up. On non-iOS/non-installable browsers (like desktop Chrome in preview), it returns `null` — nothing is shown.

**Fix:** 
- Fix the `useEffect` bug (currently using `useState` as effect).
- Always show the Install button in settings (not conditionally hidden). When `beforeinstallprompt` hasn't fired and it's not iOS, show the button anyway with a note like "Open in browser to install" or just show it — clicking it can show a small instruction.

**File:** `src/components/BottomNav.tsx`

## 4. Snackbar not aligned properly

**Root cause:** The Sonner `offset={72}` positions the toast 72px from the bottom, but the screenshot shows it's visually misaligned — it appears to sit too close to the nav bar or not centered. The toast also shows left-aligned in the screenshots.

**Fix:** Adjust the Sonner config:
- Increase offset to account for bottom nav height (56px) + safe area + some breathing room (~80px).
- Ensure `position="bottom-center"` is working. Add explicit width constraint via `style` or `className` to center it within the `max-w-md` layout.

**File:** `src/components/ui/sonner.tsx`

---

## Technical Summary

| Issue | File(s) | Change |
|-------|---------|--------|
| Home button reset | `BottomNav.tsx`, `Index.tsx` | Clear sessionStorage + dispatch custom event to reset mode |
| Checkbox double-toggle | `MealPlanResults.tsx` | Remove `onCheckedChange` from Checkbox, use parent div click only |
| Install CTA always visible | `BottomNav.tsx` | Fix `useState` → `useEffect` for event listener; always render install option |
| Snackbar alignment | `sonner.tsx` | Adjust offset and ensure proper centering |

