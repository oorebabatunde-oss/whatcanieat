

## Fix Meal Plan Generation Timeouts

### Problem Analysis
- 3-day plans take ~43 seconds (acceptable but slow)
- 7-day single-shot plans risk the 150s edge function timeout with retries
- 30-day SSE streaming keeps the connection alive for 6 chunks × ~40s = ~240s, exceeding timeouts
- The client uses `supabase.functions.invoke` for plans ≤7 days, which has its own timeout ceiling

### Root Causes
1. **Slow model**: `google/gemini-2.5-flash` is decent but not the fastest option
2. **Single-shot for 7-day plans**: Too much output for one AI call, risks truncation and retries
3. **Client timeout**: `supabase.functions.invoke` for short plans has a hard timeout (~120s default)
4. **Overly verbose output**: Full tool schema requests detailed structured data for every meal

### Solution: SSE Streaming for All Durations + Faster Model + Chunking 7-Day Plans

**1. Switch to `google/gemini-3-flash-preview`** (faster generation, same quality tier)

**2. Use SSE streaming for ALL durations** (not just 30-day)
- Client always uses raw `fetch` with SSE parsing instead of `supabase.functions.invoke`
- This eliminates the client-side invoke timeout entirely
- Progress messages work for all plan sizes

**3. Chunk 7-day plans** into 2 chunks (days 1-4, days 5-7) instead of single-shot
- Each chunk stays well under timeout limits
- Only 1-day and 3-day plans remain single-shot (they complete in ~40s)

**4. Simplify chunk prompts** for speed
- Reduce max recipe steps from 4 to 3 per chunk
- Skip grocery list in individual chunks — compute merged grocery list in a final lightweight AI call or derive it from ingredients
- Reduce `max_tokens` per chunk from 12000 to 8000

### Files to Change

**`supabase/functions/generate-meal-plan/index.ts`**
- Change model to `google/gemini-3-flash-preview`
- Move the SSE streaming threshold from `> 7` to `> 3` (so 7-day and 30-day both stream)
- 7-day plans chunk into groups of 4+3 days
- Build grocery list by aggregating ingredients from all days post-generation (no per-chunk grocery request)
- Reduce per-chunk `max_tokens` to 8000

**`src/components/mealplan/MealPlanContext.tsx`**
- Use SSE streaming (`fetch` + reader) for ALL durations instead of only 30-day
- Remove the `supabase.functions.invoke` path for short plans
- This ensures the client never hits an invoke timeout regardless of plan size

### Technical Details

```text
Duration → Strategy
─────────────────────────────
1-day    → Single-shot + SSE stream (fast, ~15-20s)
3-day    → Single-shot + SSE stream (fast, ~25-35s)  
7-day    → 2 chunks (4+3) + SSE stream (~40-50s total)
30-day   → 6 chunks (5×6) + SSE stream (~2-3 min)
```

The edge function will always return `text/event-stream` with progress/complete/error events. The client always parses SSE. This unified approach eliminates timeout mismatches between invoke and streaming paths.

