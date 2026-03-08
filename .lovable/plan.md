## Issues

1. **"How to make" opens Google Search** — The preview iframe blocks navigation to `google.com`. Using `window.open` to Google won't work in the Lovable preview sandbox.
2. **"Where to buy" uses Overpass API** — The network logs show a 504 Gateway Timeout from `overpass-api.de`. This free API is unreliable and often overloaded.

## Plan

### 1. Fix "How to make" — Search google for existing recipe and video

### 2. Fix "Where to buy" —   
Option A. Search on ubereats or doordash etc  
  
Option B. Replace Overpass API with a more reliable approach

Replace the unreliable Overpass API with a simpler, more reliable approach using Nominatim search for nearby food places.

- **Create `supabase/functions/nearby-places/index.ts**` — An edge function that uses the Overpass API server-side (with better timeout handling and retry logic), or alternatively uses Nominatim's search endpoint to find restaurants/stores near coordinates. This proxies the request to avoid CORS/timeout issues in the browser.
- **Update `src/pages/WhereToBuy.tsx**` — Call the new edge function instead of directly hitting Overpass from the client. Add proper error handling and a retry button. Increase the timeout tolerance.

### Summary of files to create/edit


| File                                        | Action                                             |
| ------------------------------------------- | -------------------------------------------------- |
| `supabase/functions/recipe/index.ts`        | Create — AI recipe generation                      |
| `src/pages/Recipe.tsx`                      | Create — Recipe display page                       |
| `src/App.tsx`                               | Edit — Add `/recipe` route                         |
| `src/components/quiz/ResultsScreen.tsx`     | Edit — Navigate to `/recipe` instead of Google     |
| `supabase/functions/nearby-places/index.ts` | Create — Proxy for place search                    |
| `src/pages/WhereToBuy.tsx`                  | Edit — Use edge function, add error/retry handling |
