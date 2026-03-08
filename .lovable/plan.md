

## Design Refresh Plan

### Changes

**1. Fonts**
- Replace Nunito → **Playpen Sans** (headings/app name)
- Replace Space Grotesk → **Manrope** (body)
- Update Google Fonts import in `src/index.css`, font-family references in `tailwind.config.ts`, and any hardcoded font-family in CSS

**2. Color Palette**
Update CSS variables and Tailwind config to use the new brand colors:
- `#E1D6EA` — soft lavender (backgrounds, cards)
- `#80CFA9` — mint green (secondary/meal)
- `#C9D7F8` — soft blue (accent areas)
- `#4C6663` — dark teal (foreground text, primary buttons)

Remap `--primary`, `--secondary`, `--accent`, `--background`, etc. to these colors throughout `src/index.css`.

**3. Homepage Layout**
- Change the two action buttons ("What am I craving?" and "Scan my fridge") from **vertical stack to horizontal side-by-side** layout using a flex row
- Make buttons **square/rectangular with rounded corners** (not pill-shaped, not tall cards) — more compact, icon on top, text below
- Replace the bland Lucide icons (`Utensils`, `Camera`) with more visually appealing/expressive alternatives or styled emoji-based illustrations

**4. Quiz Button Consistency**
- All option buttons throughout the quiz (CravingStep, FlavorStep, TextureStep) should be **rectangular with rounded corners** — consistent shape language
- Remove pill/full-round styling from flavor and texture chips; use rounded-lg rectangles instead

**5. Final Button Text**
- In `TextureStep.tsx`, change the submit button text from "Show me food!" to **"Show me what I can eat"**

### Files to Edit
- `src/index.css` — fonts import + CSS variables
- `tailwind.config.ts` — font families + color updates
- `src/pages/Index.tsx` — horizontal button layout, new icons, rectangular buttons
- `src/components/quiz/CravingStep.tsx` — rectangular button styling
- `src/components/quiz/FlavorStep.tsx` — rectangular chip styling
- `src/components/quiz/TextureStep.tsx` — rectangular chip styling + button text change

