

# Fix: Missing i18n key for install browser message

**Problem:** The snackbar shows the raw key `settings.installBrowser` because that translation key was never added to `src/lib/i18n.tsx`. The fallback `|| "Open this site..."` doesn't work because `t()` returns the key string (truthy) when no translation exists.

**Fix (2 changes):**

1. **`src/lib/i18n.tsx`** — Add `"settings.installBrowser"` key to all 14 language blocks with appropriate translations (e.g. English: `"Open this site in your browser to install it as an app"`)

2. **`src/components/BottomNav.tsx`** — Fix the fallback logic. Change:
   ```ts
   t("settings.installBrowser") || "Open this site..."
   ```
   to just:
   ```ts
   t("settings.installBrowser")
   ```
   since the translation will now exist. Alternatively, make the fallback work by checking if the returned value equals the key.

