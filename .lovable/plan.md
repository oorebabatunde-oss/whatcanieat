## SEO & GEO improvements

Apply fixes 1, 2, 3 from the previous discussion. Skip #5 (sitemap `lastmod`) since stale dates are worse than none without a build-time generator.

---

### 1. Sync JSON-LD `inLanguage` to all 14 locales

**File:** `index.html`

In the JSON-LD `WebApplication` schema, replace the 7-locale array with all 14:

```
"inLanguage": ["en","es","fr","de","pt","ar","zh","ja","ko","hi","tr","it","nl","ru"]
```

---

### 2. Add missing Open Graph + Twitter tags

**File:** `index.html`

Add to `<head>`:

- `og:url` → `https://whatcanieat.food/`
- `og:site_name` → `What Can I Eat?`
- `og:type` already present
- `twitter:title` → `What Can I Eat? — Food Recommendations`
- `twitter:description` → same as meta description

Result: branded preview cards on iMessage, Slack, WhatsApp, Twitter/X, LinkedIn, Discord.

---

### 3. Dynamically update `<html lang>` when locale changes

**File:** `src/lib/i18n.tsx`

Inside `I18nProvider`, add a `useEffect` that runs whenever `lang` changes:

```ts
useEffect(() => {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}, [lang]);
```

Benefits:

- Screen readers pronounce content with the correct language profile.
- Browser "Translate this page?" prompts behave correctly.
- Spellcheck dictionary matches the UI.
- Bonus: sets `dir="rtl"` for Arabic automatically.

Note: this also fixes a subtle a11y bug today where Arabic users get `lang="en"`.

---



---

### Out of scope

- Sitemap `<lastmod>` (skip — no build-time generator).
- Locale-prefixed routes + `hreflang` (much bigger refactor; would require routing changes and pre-rendering for SEO value).

### Files touched

- `index.html` (fixes 1, 2, 4)
- `src/lib/i18n.tsx` (fix 3)