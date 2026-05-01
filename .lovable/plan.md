The recommendation card stack on the craving quiz uses a fixed container height of `520px`, but the actual card (4:3 image + title + description + 2 buttons) is roughly ~440px tall on a 390px-wide viewport. That leaves ~80px of empty space between the bottom of the card and the Skip/Save action buttons below.

Fix:

1. In `src/components/quiz/ResultsScreen.tsx`, reduce the card-stack container height from `520` to `460` so the action buttons sit closer to the card.
2. Tighten the spacing between the action button row and the undo / counter row below it (currently both rely on the parent's default flex gap), keeping the existing `mt-2` on the buttons.
3. Verify visually at 390x844 that:
   - There is no large empty gap below the card.
   - The card does not get clipped (image + title + description + How to make / Where to buy buttons all visible).
   - Skip/Save circle buttons and the "Undo  1/3" row remain above the bottom navigation.

No other files need to change.