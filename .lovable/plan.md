## Plan: Rename kitchen button + add subtexts to both home buttons

### Changes

**1. `src/lib/i18n.tsx**` (all 14 languages)

- Change `home.scanFridge` to: **"What can I eat that I already have"** (EN) with appropriate translations
- Add `home.findCravingSubtext`: e.g. "Answer a few questions and we'll suggest the perfect dish" (EN)
- Add `home.scanFridgeSubtext`: e.g. "Snap a photo or type what you have to get recipe ideas " (EN)
- Translate both new keys into all 13 other languages

**2. `src/pages/Index.tsx**`

- Update both home buttons to include a subtext line beneath the main label
- Restructure button content from single `<span>` to a two-line layout: bold title + smaller muted description
- Widen the buttons slightly to accommodate the longer text