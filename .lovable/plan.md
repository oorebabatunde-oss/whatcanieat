

## Current Behavior

There is **no undo mechanism**. When a user swipes left (nope), `handleSwipeLeft` simply calls `advance()` which increments `currentIndex`. The rejected card is gone permanently — there's no history tracking and no way to go back.

## Plan: Add "Undo Last Swipe" Button

### Approach
Track a history stack of swiped cards. Show an "Undo" button that restores the last swiped card back to the current position.

### Changes

**`src/components/quiz/ResultsScreen.tsx`**
- Add a `swipeHistory` state: array of `{ index: number, action: "left" | "right" }` 
- On each swipe (left or right), push the current index + action to history before advancing
- If the undone card was a right-swipe (saved), also delete it from the `saved_recommendations` table
- Add an "Undo" button (with `Undo2` icon from lucide) next to the card counter at the bottom, visible only when history is non-empty and cards are still showing
- On undo: pop the last entry, set `currentIndex` back, and if `allSwiped` is true, set it back to false

**`src/lib/i18n.tsx`**
- Add `results.undo` translation key across all languages (e.g., "Undo" / "Deshacer" / "Annuler" etc.)

### UX
- Small ghost/outline button with ↩ icon below the swipe cards, next to the "1/3" counter
- Shows a brief toast: "Restored [dish name]"
- Only allows undoing the **last** swipe (single level) to keep it simple — the button disappears after undo until the next swipe

