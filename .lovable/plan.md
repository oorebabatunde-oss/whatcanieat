# Add Medical Condition Options to Safety Considerations

Add medical/health condition options to the existing `SAFETY_OPTIONS` array in `src/components/mealplan/ConsiderationsScreen.tsx`.

## Change

**File:** `src/components/mealplan/ConsiderationsScreen.tsx`

Add the following options to the `SAFETY_OPTIONS` array:

- "Dialysis"
- "Chemotherapy"
- "Kidney disease"
  &nbsp;
- "Heart disease"
- "High blood pressure"

These will appear as selectable chips alongside the existing allergy/dietary options. No other file changes needed — the safety array already supports any string values.