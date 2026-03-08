

## Problem

The Unsplash image search returns mismatched images (e.g., Mexican tortilla plate for "Churros", fried fish for "Chicken Piccata"). The root cause is the `looksLikeFood` filter in the `unsplash-image` function — it picks the **first** result that contains any generic food keyword, not the one that actually matches the dish. Unsplash's search results for broad queries like "churros food dish" may return any Latin food photo that happens to have food tags.

## Fix

### 1. Improve Unsplash query strategy (`unsplash-image/index.ts`)

- Change the search queries to be more specific — search for the **exact dish name** first, then progressively broaden
- Replace the generic `looksLikeFood` filter with a **relevance check** that verifies the photo's `alt_description` / `description` / `tags` actually mention the dish name (or key words from it)
- If no relevant Unsplash match is found, fall through to Wikipedia / AI generation faster

### 2. Add dish-name relevance scoring

Instead of just checking if any food keyword exists, check if the photo metadata contains words from the actual query. For example, for "Churros", the photo should mention "churros" or "churro" in its description/tags.

```text
Current flow:  search "churros food dish" → pick first result with ANY food keyword → wrong image
New flow:      search "churros food" → pick first result mentioning "churros" → if none, try Wikipedia → AI fallback
```

### 3. Specific changes to `unsplash-image/index.ts`

- Replace `looksLikeFood` with a new `isRelevantPhoto(photo, query)` function that checks if the photo metadata contains the dish name keywords
- Adjust search queries: `[sanitizedQuery, sanitizedQuery + " food"]` (remove the overly broad third query)
- If no relevant Unsplash result found, still fall through to Wikipedia/AI as today

### Files to change
- `supabase/functions/unsplash-image/index.ts` — Replace food-match logic with relevance-based matching

