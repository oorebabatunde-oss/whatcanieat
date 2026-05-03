## Problem

The Sign In page asks for an 8-digit code, but the email contains a "Sign In" button (link) instead. Clicking the link logs the user in directly — bypassing the OTP input — and if they try to type a code, they have nothing to enter.

The cause is in `supabase/functions/_shared/email-templates/magic-link.tsx`: the template only renders a `confirmationUrl` button. It ignores the `token` value that Supabase Auth passes in for OTP-style sign-in.

## Fix

1. Update `magic-link.tsx` to display the 8-digit `token` prominently as the primary content, styled as a large, monospaced, letter-spaced code block. Remove the "Sign In" button (or keep it as a small secondary fallback — recommend removing to avoid the link-vs-code confusion entirely, matching the app's OTP-only flow).
2. Update the template's props interface to accept `token: string`.
3. Update the preview `SAMPLE_DATA.magiclink` in `auth-email-hook/index.ts` — already has `token: '123456'`, change to an 8-digit sample like `'12345678'` for accurate preview.
4. Apply brand styling consistent with the existing template (Inter font, brand green accent, white background per email guidelines).
5. Redeploy the `auth-email-hook` edge function so the change takes effect.

## Files

- `supabase/functions/_shared/email-templates/magic-link.tsx` — render token, remove/demote link
- `supabase/functions/auth-email-hook/index.ts` — bump sample token to 8 digits
- Deploy: `auth-email-hook`
