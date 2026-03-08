

## Problem Diagnosis

I tested the edge functions directly and found the root causes:

### 1. `recommend` — Caught during redeployment
The function **works correctly now** (my direct test returned 200 with recommendations). The "Failed to send a request" error the user saw was because the function was being redeployed at that exact moment (logs show multiple boot/shutdown cycles at 21:42-21:43, exactly when the user's requests failed). However, there's a secondary issue: calling `getClaims()` with the anon key (sent automatically when no user is logged in) is wasteful and occasionally slow.

### 2. `scan-ingredients` — Requires authentication, user is anonymous
The logs clearly show repeated `"Invalid token: IP=92.40.47.80"` (the user's IP). The function **mandates JWT auth + role check** (lines 64-105), so anonymous users always get 401. The "loads forever" is likely the client not properly surfacing the error, or `getClaims` hanging on the anon key before returning the 401.

---

## Plan

### A. Make `scan-ingredients` auth-optional (same pattern as `recommend`)
- Remove the mandatory auth gate (lines 64-105)
- Use the same optional-auth try/catch block as `recommend`: attempt `getClaims`, fall back to `"anonymous"` on failure
- Remove the role check requirement for basic scanning
- Keep IP-based rate limiting for anonymous users (keep the stricter 10 req/min limit since it's an expensive operation)

### B. Fix anon-key detection in both `recommend` and `scan-ingredients`
- Before calling `getClaims()`, check if the token matches the known anon key pattern (i.e., the `role` claim is `"anon"` not a user). Simply skip auth entirely if the token is the anon key — this avoids unnecessary API calls and potential hangs.
- Decode the JWT payload (base64) without verification to check `role === "anon"`, then skip `getClaims`.

### C. Add fetch timeout to AI gateway calls
- Wrap the `fetch()` to the AI gateway with `AbortSignal.timeout(120_000)` (120 seconds) in both `recommend` and `scan-ingredients`
- This prevents indefinite hangs if the AI gateway is slow, returning a clear error instead

### D. Ensure `unsplash-image` has the same anon-key handling
- Apply the same anon-key skip logic for consistency

### Files to change
- `supabase/functions/scan-ingredients/index.ts` — Major: remove mandatory auth, add optional auth pattern, add fetch timeout
- `supabase/functions/recommend/index.ts` — Minor: add anon-key skip, add fetch timeout
- `supabase/functions/unsplash-image/index.ts` — Minor: add anon-key skip

