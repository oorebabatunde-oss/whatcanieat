

## Add Dietary Constraints Step

Insert a new step between Texture and Results to capture dietary restrictions before generating AI recommendations.

### Changes

**1. QuizContext.tsx**
- Add `DietaryConstraint` type: `"vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal" | "kosher" | "none"`
- Add `dietary: DietaryConstraint[]` to `QuizState`
- Add `toggleDietary` function (same pattern as `toggleFlavor`/`toggleTexture`)
- Update initial state and context provider

**2. Create DietaryStep.tsx**
- New component following the same pattern as TextureStep
- Options: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher, + "No Restrictions"
- Multi-select with "No Restrictions" clearing other selections
- Button: "Get my recommendations"

**3. QuizFlow.tsx**
- Update `stepLabels` to `["Craving", "Flavour", "Texture", "Dietary", "Results"]`
- Add `{state.step === 3 && <DietaryStep key="dietary" />}`
- Move Results to step 4
- Update back button visibility (`state.step < 4`)

**4. ResultsScreen (later)**
- Pass `dietary` constraints to the AI edge function when implemented

### Flow
```text
Craving → Flavour → Texture → Dietary → Results
(step 0)  (step 1)  (step 2)  (step 3)  (step 4)
```

