

# Add "Other" option to Safety Considerations

Add a free-text "Other" chip to the safety section in `src/components/mealplan/ConsiderationsScreen.tsx`. When selected, show a text input for the user to type a custom safety consideration.

## Changes

**File:** `src/components/mealplan/ConsiderationsScreen.tsx`

1. After the existing safety chips, add an "Other" chip that toggles a text input
2. When the user types a custom value, store it in `local.safety` as a free-text entry
3. Use a local state variable `showOtherSafety` to control the input visibility

**File:** `src/components/mealplan/MealPlanContext.tsx`

No changes needed — `safety` is already a `string[]`, so custom entries work as-is.

