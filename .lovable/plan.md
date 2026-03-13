

## Remove Cycling Food Emojis, Keep Plate + Circular Spinner

Replace the `AnimatePresence` cycling food animation (lines 83-97) with a static plate emoji and a CSS circular spinner around/above it. Remove the `FOODS` array, `foodIndex` state, and the food-cycling `useEffect`. Remove `framer-motion` imports since they're no longer needed.

### Changes in `src/components/ui/PlateLoader.tsx`
- Remove: `FOODS` array, `foodIndex` state, food-cycling `useEffect`, `motion`/`AnimatePresence` imports
- Replace the animation container with: a plate emoji (`🍽️`) centered inside a CSS `animate-spin` ring (using a `border` spinner div)
- Keep everything else (progress bar, steps, notify button) unchanged

