
## Issues Identified

1. **Loading text**: Line 62 says "Our AI chef is thinking..." - needs clearer, simpler wording
2. **Recommendations lack real data**: Current AI prompt generates generic food names without:
   - Region/location awareness
   - Real meal names from actual cuisines
   - Images/photos
3. **No images**: The recommendation cards only show emojis, no actual food photos

## Plan

### 1. Fix Loading Text
Change "Our AI chef is thinking..." → "Finding recommendations..."

### 2. Pass User Region to Backend
- Detect user's region via `navigator.language` or browser timezone on the frontend
- Pass this `locale` to the edge function

### 3. Enhance AI Prompt for Real Meals
Update the system prompt to:
- Request **real, named dishes** from the user's region/culture
- Include the dish's country/cuisine of origin
- Generate a search query for finding images

### 4. Add Food Images via Unsplash
Use the free Unsplash Source API (no API key required) to fetch relevant food images:
- Format: `https://source.unsplash.com/400x300/?{food_name},food`
- This provides real, high-quality photos without branding

### 5. Update Recommendation Interface
New response shape:
```typescript
{
  name: string;        // Real dish name (e.g., "Pad Thai", "Fish and Chips")
  description: string; // Why it matches their preferences
  cuisine: string;     // Country/region of origin
  imageQuery: string;  // Search term for Unsplash
}
```

### 6. Update ResultsScreen UI
- Replace emoji with actual food image (using Unsplash)
- Add cuisine tag
- Use AspectRatio for consistent image sizing
- Handle image loading states

### Files to Modify
- `src/components/quiz/ResultsScreen.tsx` - loading text, image display, locale detection
- `supabase/functions/recommend/index.ts` - updated prompt with region context and image queries

### Technical Notes
- Unsplash Source API is free for hotlinking, no key needed
- `navigator.language` gives locale like "en-GB", "en-US", "fr-FR"
- `Intl.DateTimeFormat().resolvedOptions().timeZone` gives timezone which can hint at region
