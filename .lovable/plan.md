

## Plan: Fix Navigation Gaps

### 1. Toast with sign-in action in ResultsScreen
When an unauthenticated user swipes right, replace the plain toast with one that includes a clickable "Sign In" action button navigating to `/auth` via `useNavigate`.

**File:** `src/components/quiz/ResultsScreen.tsx`
- Import `useNavigate` from react-router-dom
- Change `toast(t("results.loginToSave"))` to use `toast()` with an `action` object containing a button that calls `navigate("/auth")`

### 2. "View Saved" button after all cards swiped
In the `allSwiped` section of ResultsScreen, add a "View Saved" button (visible when `user` is truthy) linking to `/saved`, placed alongside the existing "Refine" and "Start Over" buttons.

**File:** `src/components/quiz/ResultsScreen.tsx`

### 3. Back to Home + navigation on Auth page
Add a "Back to Home" link (ArrowLeft icon + text) at the top-left of the Auth page toolbar, linking to `/`. The `ArrowLeft` icon is already imported but unused.

**File:** `src/pages/Auth.tsx`
- Add `Link` import from react-router-dom
- Add a back button in the toolbar: `<Link to="/"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>`

### i18n
Add any missing translation keys (e.g., `results.viewSaved`, `auth.backHome`) across all languages in `src/lib/i18n.tsx`.

