

## Consolidate to Sonner and fix snackbar UX

The screenshot shows two overlapping toast systems producing a cluttered, confusing notification. The app currently mounts **both** Radix Toast and Sonner, and different files import from different systems. This needs to be unified.

### What changes

1. **Remove the Radix toast system entirely**
   - Delete `src/components/ui/toaster.tsx`, `src/components/ui/toast.tsx`, `src/hooks/use-toast.ts`, `src/components/ui/use-toast.ts`
   - Remove `<Toaster />` (Radix) from `App.tsx`, keep only `<Sonner />`

2. **Migrate all toast calls to Sonner**
   - `src/components/mealplan/MealPlanResults.tsx`: replace `import { toast } from "@/hooks/use-toast"` with `import { toast } from "sonner"`, change `toast({ title: ... })` to `toast.success(...)` / `toast.error(...)`
   - `src/components/quiz/ResultsScreen.tsx`: already uses Sonner — no change needed

3. **Improve Sonner configuration** in `src/components/ui/sonner.tsx`
   - Position toasts at **bottom-center** (mobile-friendly thumb zone)
   - Set `duration` to 3s for success, longer for errors
   - Keep `closeButton` enabled
   - Ensure consistent styling with the app theme

### Technical details

- Only 2 files call toast outside the UI layer: `MealPlanResults.tsx` (Radix) and `ResultsScreen.tsx` (Sonner)
- Sonner's API is simpler: `toast.success("Saved!")`, `toast.error("Failed")`, `toast("Undo: ...")`
- 4 files deleted, 2 files edited, 1 file updated

