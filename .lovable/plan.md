

## Plan: Add SEO & AI-readable structured metadata

Add invisible metadata for search engines and AI systems. **No secrets, no API keys, no internal URLs exposed** — purely public descriptive content.

### Changes

**1. `index.html` — JSON-LD structured data + meta tags**
- Add `<script type="application/ld+json">` with Schema.org `WebApplication` markup: app name, description, category ("FoodApplication"), feature list, pricing ("free"), platform ("Web")
- Add `<meta name="keywords">` covering food recommendation, recipe finder, fridge scanner, meal ideas
- Add `<meta name="robots" content="index, follow">`

**2. `public/llms.txt` — AI-readable plain text description**
- Emerging convention read by AI assistants (ChatGPT, Perplexity, Gemini) to understand site purpose
- Describes features: quiz-based food recommendations, fridge photo scanning, dietary filters, multilingual support
- Contains **no internal URLs, secrets, or implementation details** — only public-facing feature descriptions

**3. `public/robots.txt` — Add references**
- Add `Sitemap: https://whatcanieat.lovable.app/sitemap.xml`
- No sensitive paths exposed; all entries are public

### Security notes
- No API keys, internal endpoints, or infrastructure details are exposed
- JSON-LD contains only public marketing copy
- `llms.txt` describes user-facing features only, no architecture or backend details

