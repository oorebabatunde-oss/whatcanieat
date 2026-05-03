## Add resend cooldown timer

Supabase rate-limits OTP requests (~60s). Currently users tap "Resend code" and get a red error. Add a visible countdown so they know when resending is allowed.

### Changes

**`src/pages/Auth.tsx`**
- Add `cooldown` state (seconds remaining), default 60 after sending code.
- Start countdown when initial code is sent (`handleSubmit` success) and after each successful resend (`handleResend` success).
- `useEffect` with `setInterval` decrementing every 1s, stops at 0.
- Disable the Resend button while `cooldown > 0`.
- Button label:
  - `cooldown > 0`: "Resend code in {n}s"
  - `cooldown === 0`: "Resend code" (existing `t("auth.resendCode")`)
- If the API still returns a rate-limit error (e.g. user lands mid-cooldown), parse the seconds from the error message and seed the timer instead of showing the raw red text.

**`src/lib/i18n.tsx`**
- Add new key `auth.resendIn` with `{seconds}` placeholder, translated across all 14 supported languages (mirroring existing `auth.*` keys).

### Technical notes
- Timer uses `useEffect` + `setInterval`; cleanup on unmount and when reaching 0.
- Cooldown seeded to 60s (matches Supabase default OTP rate-limit window).
- No backend/DB/edge function changes.
