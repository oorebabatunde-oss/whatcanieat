

## Plan: Allow Guest Saving with Session-Only Storage

### Problem
Currently, unauthenticated users get a "Sign in to save" toast when swiping right. They can't save anything without logging in.

### Solution
Store guest saves in `localStorage` so unauthenticated users can save recommendations. On the Saved page, show a warning banner for guests explaining that saves will be lost when the session ends, with a login CTA.

### Changes

**1. `src/components/quiz/ResultsScreen.tsx`**
- In `handleSwipeRight`: when no user, save to `localStorage` instead of showing login toast. Show a `toast.success` same as logged-in users.
- In `handleUndo`: when no user and last action was right-swipe, remove from `localStorage`.

**2. `src/pages/Saved.tsx`**
- Remove the auth guard redirect to `/auth`.
- When not logged in, load items from `localStorage` instead of the database.
- Show a warning banner at the top: "Your saved recommendations are stored locally and will be lost when you clear your browser. Sign in to keep them forever!" with a Sign In button.
- Delete from `localStorage` for guest users.

**3. `src/lib/i18n.tsx`**
- Add new translation keys across all 14 languages:
  - `saved.guestWarning` — warning message about session-only storage
  - `saved.signInToKeep` — CTA text like "Sign in to keep them"
- Update `results.loginToSave` usage (it will no longer be needed, but can be repurposed or removed).

### localStorage Format
Key: `guest_saved_recommendations`
Value: JSON array of `{ id, name, description, cuisine, image_query, created_at }`

