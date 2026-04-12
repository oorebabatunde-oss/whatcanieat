

# Update OTP Email Subject

Change the email subject line for the OTP sign-in email from "Your login link" to "Sign in to whatcanieat".

## Change

**File:** `supabase/functions/auth-email-hook/index.ts`

Update the `magiclink` entry in the `EMAIL_SUBJECTS` object:
```
magiclink: 'Sign in to whatcanieat',
```

Then redeploy the `auth-email-hook` Edge Function.

