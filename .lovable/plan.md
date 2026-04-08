

# Plan: UX Overhaul — Snackbars, Navigation, Actions, Grocery Checkmarks & Install

## Summary

Six changes across the app: (1) consolidate toasts to Sonner following Material Design 3 snackbar guidelines, (2) update craving results buttons, (3) add "more recipes" to fridge scanner, (4) add grocery list checkmarks, (5) redesign navigation with a persistent bottom tab bar, (6) add installability via web app manifest.

---

## 1. Standardise Snackbars to M3 Best Practice

**Problem:** Two competing toast systems (Radix + Sonner). MealPlanResults and MealPlanContext still use the Radix `toast()` from `@/hooks/use-toast`. Inconsistent positioning, timing, and action support.

**Changes:**
- **Remove Radix toast system**: Delete `<Toaster />` (Radix) from `App.tsx`. Keep only `<Sonner />`.
- **Migrate all `toast()` calls** in `MealPlanResults.tsx` and `MealPlanContext.tsx` from `import { toast } from "@/hooks/use-toast"` to `import { toast } from "sonner"`.
- **Configure Sonner** in `App.tsx` to match M3 guidelines:
  - Position: `bottom-center` (mobile thumb-zone friendly)
  - Single line text, max 2 lines
  - Success: 5s auto-dismiss; Error: 10s with close button; Info with optional action button
  - Add `action` buttons for error toasts (e.g. "Retry" on generation failures)
- **Update error toasts** in MealPlanContext to include a retry action.
- **Clean up** — can optionally remove `use-toast.ts` and `toaster.tsx` if no other imports remain.

---

## 2. Craving Results — New Action Buttons

**Current:** After swiping all cards, shows "View Saved Dishes", "Refine my craving", "Start Over".

**New buttons (in order):**
1. **View Saved Dishes** — unchanged, navigates to `/saved`
2. **Show More Options** — calls the recommend API again (same params, adds current results to `rejected` list) to get fresh suggestions without requiring feedback text
3. **Refine My Craving** — existing refine flow with text input

Remove "Start Over" from the primary actions (keep as a subtle ghost link below). Add i18n keys for "Show More Options" in all 14 languages.

---

## 3. Fridge Scanner — "See More Recipes" Button

**Current:** Results show recipes with "Scan Again" and "Back to Home" at the bottom.

**Change:** Add a **"Show More Recipes"** button above "Scan Again" that re-invokes the edge function (`scan-ingredients` or `ingredients-to-recipes`) with the same ingredients but passes the current recipe names as `exclude` so the AI generates new ones. Add a loading state while fetching. Add i18n keys for all 14 languages.

---

## 4. Meal Plan — Grocery List Checkmarks

**Current:** Grocery list items are plain text rows.

**Change:** Add a `Checkbox` (from `@/components/ui/checkbox`) to each grocery item row. Checked state stored in local component state (`useState<Set<string>>`). Checked items get a strikethrough style. A small counter shows "X of Y checked" at the top of the grocery tab. State resets when a new plan is generated.

---

## 5. Redesign Navigation — Persistent Bottom Tab Bar

**Current:** Navigation is ad-hoc — toolbar with scattered icon buttons at the top of each page, no consistent nav pattern.

**New approach (NN/g best practice — visible, persistent, labeled navigation):**
- Create a **bottom navigation bar** component (`BottomNav.tsx`) with 4 tabs:
  1. 🍽️ **Home** — `/` (welcome screen)
  2. 📋 **Saved** — `/saved`
  3. 🌐 **Language** — opens language switcher
  4. ⚙️ **Settings** — theme toggle, sign in/out, install app
- Each tab has an **icon + label** (following NN/g: always show labels, don't rely on icons alone)
- Active tab highlighted with primary color
- Fixed to bottom of viewport, 56px height, safe-area padding for notched devices
- Remove the current scattered toolbar from `Index.tsx` and `Saved.tsx`
- On desktop (>768px), optionally render as a top horizontal nav bar instead
- Add i18n keys for nav labels in all 14 languages

---

## 6. Install on Device (Simple Manifest — No PWA Service Worker)

**Change:** Add a `manifest.json` to `public/` with app name, icons, `display: "standalone"`, and theme colors. Add `<link rel="manifest">` to `index.html`. Create a simple install prompt in the Settings tab of the new bottom nav (or a dedicated `/install` route) that:
- Detects `beforeinstallprompt` event on Android/Chrome
- Shows iOS instructions ("Share → Add to Home Screen") on Safari
- No service worker, no `vite-plugin-pwa` — just installability

Generate app icons (192x192, 512x512) as simple colored squares with the app emoji.

---

## Technical Details

**Files to create:**
- `src/components/BottomNav.tsx` — bottom navigation bar
- `public/manifest.json` — web app manifest
- `public/icon-192.svg`, `public/icon-512.svg` — app icons

**Files to modify:**
- `src/App.tsx` — remove Radix Toaster, add layout wrapper with BottomNav, configure Sonner position
- `src/pages/Index.tsx` — remove toolbar, simplify header
- `src/pages/Saved.tsx` — remove toolbar, simplify header
- `src/components/quiz/ResultsScreen.tsx` — new "Show More Options" button + reorder actions
- `src/components/scan/FridgeScanner.tsx` — add "Show More Recipes" button + exclude logic
- `src/components/mealplan/MealPlanResults.tsx` — migrate toast to Sonner, add grocery checkmarks
- `src/components/mealplan/MealPlanContext.tsx` — migrate toast to Sonner, add retry actions
- `src/lib/i18n.tsx` — new i18n keys across all 14 languages
- `index.html` — add manifest link + meta tags for mobile
- `src/components/ui/sonner.tsx` — update position to `bottom-center`, add offset for bottom nav

**Files to potentially delete:**
- `src/hooks/use-toast.ts` — if no remaining imports
- `src/components/ui/toaster.tsx` — Radix toaster
- `src/components/ui/use-toast.ts` — re-export wrapper

