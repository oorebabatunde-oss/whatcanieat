

# Switch from Magic Link to Email OTP

## Overview
Replace magic link authentication with a 6-digit OTP code flow. Users enter their email, receive a code, type it in, and are signed in immediately. No signup confirmation or reauthentication needed.

## Changes

### 1. Enable auto-confirm email signups
Use `configure_auth` to set `double_confirm_email_changes: false` and enable auto-confirm so users don't need to verify their email separately.

### 2. Update `src/hooks/useAuth.tsx`
- Rename `signInWithMagicLink` to `signInWithOtp` — keep using `supabase.auth.signInWithOtp()` but remove `emailRedirectTo` (forces code delivery instead of link)
- Add `verifyOtp(email, token)` method that calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`

### 3. Rewrite `src/pages/Auth.tsx`
- After email submission, show a 6-digit OTP input (using the existing `InputOTP` component)
- On OTP completion, call `verifyOtp` — success auto-signs the user in via `onAuthStateChange`
- Keep resend and change-email functionality
- Remove all magic-link-specific copy (no "check your email for a link")

### 4. Update i18n strings in `src/lib/i18n.tsx`
Update all 14 language blocks:
- `auth.subtitle` → "Enter your email and we'll send you a code"
- `auth.sendLink` → "Send Code"
- `auth.checkEmail` → "Enter your code"
- `auth.linkSent` → "We sent a 6-digit code to your email"
- `auth.otpSubtitle` → "Enter the code we sent to your email"
- `auth.resendCode` → "Resend code"
- Add `auth.verifying` → "Verifying..."

### 5. Update email templates
Update `magic-link.tsx` template copy to reference a code instead of a link (the OTP token is already available via `{token}`).

## Technical details
- `signInWithOtp` without `emailRedirectTo` tells Supabase to send a 6-digit code instead of a link
- `verifyOtp` with `type: 'email'` validates the code and creates a session in one step
- The `onAuthStateChange` listener in `useAuth` automatically picks up the new session, so no manual redirect is needed

