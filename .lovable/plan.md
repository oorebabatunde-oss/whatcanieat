## Fix toast design and placement

I will correct the current Sonner setup in `src/components/ui/sonner.tsx`.

### What will change

- Keep the toast synced to the user’s selected website theme via `useTheme()`.
- Keep Sonner’s `closeButton`; that is the dismiss control, equivalent to the close/undo-style control you pointed out.
- Remove the custom lucide type icons added previously, since they are not part of the reference design.
- Fix the invalid CSS variable usage by wrapping theme tokens correctly:
  - `--normal-bg: hsl(var(--popover))`
  - `--normal-text: hsl(var(--popover-foreground))`
  - `--normal-border: hsl(var(--border))`
  - `--border-radius: var(--radius)`
- Restyle the toast to look like the shadcn/Sonner reference while respecting the active theme:
  - rounded 12px/`var(--radius)` card
  - themed popover background and text
  - subtle themed border
  - stronger shadow
  - clean title/description typography
  - themed action/cancel buttons when used
- Fix mobile placement so the toast does not appear behind the bottom navigation:
  - keep `position="bottom-center"`
  - keep desktop `offset={80}`
  - add mobile bottom offset using an object, e.g. `mobileOffset={{ bottom: 88, left: 16, right: 16 }}`
  - keep Sonner’s own high z-index and avoid overriding the centering transform, because the previous manual centering style can interfere with Sonner’s responsive positioning

### File to edit

- `src/components/ui/sonner.tsx`

### Result

The toast will use the site’s selected light/dark theme, have a proper close/dismiss button, match the clean shadcn Sonner design more closely, and sit above the bottom navigation on the 390px mobile viewport.