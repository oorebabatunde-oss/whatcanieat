

## "What Can I Eat" — Food Recommendation App

### Overview
A mobile-first, minimalist yet colorful food recommendation app with a fun, step-by-step quiz flow and an AI-powered fridge scanner.

---

### Flow 1: Craving Quiz
**Step-by-step guided experience with playful UI and colorful cards:**

1. **Welcome Screen** — "What Can I Eat?" branding, two entry points: "What are you craving?" and "Scan my fridge/cupboard"
2. **Step 1: Craving Type** — Choose: "A Snack", "A Meal", or "I Don't Know" (big tappable cards with icons)
3. **Step 2: Flavor Profile** — Multi-select: Salty, Sweet, Savoury, Spicy, Sour, Umami, Bitter, or "I Don't Know" (colorful pill/chip selectors)
4. **Step 3: Texture** — Multi-select: Crunchy, Chewy, Mushy, Gooey, Crispy, Creamy, Smooth, or "I Don't Know"
5. **Results Screen** — AI-generated food recommendations with generic (unbranded) food images, each showing name, brief description, and a "Where to buy?" button
6. **Where to Buy** — Asks for location permission or provides a text field for manual entry. Uses OpenStreetMap (free, open-source) to show nearby stores (grocery, convenience) on an interactive map

### Flow 2: Fridge Scanner
1. User takes or uploads a photo of their fridge/cupboard
2. **Lovable AI (Gemini)** analyzes the image to identify ingredients
3. Shows detected ingredients (user can edit/remove)
4. AI generates recipe recommendations with:
   - Recipe name and description
   - Link to a real recipe site (AllRecipes, BBC Good Food, etc.)
   - YouTube search link for a video tutorial

### Authentication
- Passwordless login (magic link via email) — optional
- Without login: full functionality, no saved data
- With login: save favorite recipes and recommendation history

### Design
- **Mobile-first** responsive layout
- **Minimalist + colorful**: clean white/light backgrounds, vibrant accent colors for each step (e.g., warm orange for snacks, deep green for meals, playful purple for "I don't know")
- Smooth transitions between steps (progress indicator at top)
- Large touch-friendly buttons and cards
- Rounded corners, soft shadows, playful icons from Lucide

### Tech
- **Frontend**: React + Tailwind + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) for auth, edge functions, and optional user data storage
- **AI**: Lovable AI Gateway (Gemini) for image analysis and food recommendations
- **Maps**: Leaflet + OpenStreetMap (free, no API key) for nearby store locations
- **Images**: AI-generated generic food illustrations (unbranded)

