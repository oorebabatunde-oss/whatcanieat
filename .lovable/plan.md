

## AI Food Recommendations

Enable the results screen to generate real food/recipe suggestions using Lovable AI (Gemini) via Lovable Cloud.

### What it does
After the user completes the quiz, the app calls an edge function that sends their preferences (craving type, flavors, textures) to the Lovable AI Gateway. The AI returns 3-5 food suggestions with names, short descriptions, and emoji. Results stream in token-by-token for a nice UX.

### Implementation

**1. Enable Lovable Cloud**
Required for edge functions and the pre-configured `LOVABLE_API_KEY`.

**2. Create edge function `supabase/functions/suggest-food/index.ts`**
- Accepts `{ craving, flavors, textures }` from the client
- Builds a system prompt: *"You are a food recommendation engine. Given the user's preferences, suggest 3-5 foods/recipes..."*
- Uses tool calling to extract structured output: array of `{ name, emoji, description, recipe_hint }`
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `google/gemini-3-flash-preview`
- Handles 429/402 errors gracefully

**3. Update `supabase/config.toml`**
- Add `[functions.suggest-food]` with `verify_jwt = false`

**4. Update `ResultsScreen.tsx`**
- On mount, call the edge function via `supabase.functions.invoke('suggest-food', { body: { craving, flavors, textures } })`
- Show a loading spinner while waiting
- Render results as styled cards (emoji + name + description + recipe hint)
- Show error toast on failure (rate limit, payment, network)
- Keep the "Start Over" button

**5. Create a types file or inline type for suggestions**
```typescript
type FoodSuggestion = {
  name: string;
  emoji: string;
  description: string;
  recipe_hint: string;
};
```

### Files to create/edit
- `supabase/functions/suggest-food/index.ts` — new edge function
- `supabase/config.toml` — register function
- `src/components/quiz/ResultsScreen.tsx` — fetch and display AI results
- `src/integrations/supabase/client.ts` — may need to create Supabase client if not present

