

## Plan: Remove sign-in CTA from home page

The "Sign in" call-to-action button at the bottom of the welcome screen (lines ~143-155 in `src/pages/Index.tsx`) will be removed. The sign-in prompt already exists on the Saved Recommendations page as a guest warning banner, so users will still be directed to sign in when it matters.

### Change
- **`src/pages/Index.tsx`**: Delete the `{!user && ...}` block that renders the `Link to="/auth"` button with the "Sign in" text on the welcome screen (the motion.div containing the LogIn icon and sign-in CTA text).

