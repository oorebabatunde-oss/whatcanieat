

## Plan: Improve Recommendation Cards + Add Actions

### 1. Shrink recommendation cards
- Add horizontal padding (`px-6`) to the outer container so cards don't touch screen edges
- Change image aspect ratio from `4/3` to `16/9` to make cards more compact
- Reduce card text padding from `p-4` to `p-3`

### 2. Add "Where to buy" and "How to make" action buttons per card
- Add two small buttons below each card's description: **"Where to buy"** and **"How to make"**
- **Where to buy**: Opens a new page/dialog with an embedded Leaflet + OpenStreetMap map centered on the user's location (via `navigator.geolocation`), searching for nearby restaurants/stores related to the dish. Falls back to a text field for manual location entry.
- **How to make**: Generates a Google search link like `https://www.google.com/search?q=how+to+make+{dish_name}+recipe` opening in a new tab — simple, no extra backend needed.

### 3. Add "I don't want this" dismiss with optional feedback
- Add a small "Not for me" button (with `X` or `ThumbsDown` icon) on each card
- Clicking it reveals an optional text field: "Tell us why (optional)" with a Submit/Skip button
- On dismiss, the card animates out and is removed from the list
- The feedback text (if provided) plus the dish name are sent to the edge function for a replacement recommendation

### Files to create/modify
- **`src/components/quiz/ResultsScreen.tsx`** — layout fixes, action buttons, dismiss logic
- **`src/pages/WhereToBy.tsx`** (new) — Leaflet map page showing nearby places for a given dish
- **`src/App.tsx`** — add route for `/where-to-buy`

### Dependencies needed
- `leaflet` + `react-leaflet` for the map component

