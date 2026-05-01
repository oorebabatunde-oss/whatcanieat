## Fix glitchy chips and standardize spacing on 8px grid

### Root cause of chip glitch
The `Chip` button in `src/components/mealplan/ConsiderationsScreen.tsx` (line 38) uses:
```
"px-3.5 min-h-[44px] rounded-full text-sm font-medium border ..."
```
- No `inline-flex items-center justify-center` → text aligns to baseline; height varies as the font swaps in (Inter → Manrope) and as labels of different lengths render.
- No `whitespace-nowrap` → multi-word chips like "High blood pressure" can momentarily wrap during reflow.
- No fixed `h-` and no vertical `py-`, only `min-h` → produces inconsistent heights row-to-row across browsers (Safari computes `min-height` differently against flex parents).
- `px-3.5` (14px) and `gap-1.5` / `gap-2.5` break the 8px spacing system.

### Spacing audit (current → 8px grid)
Non-conforming values found in `ConsiderationsScreen.tsx`:
- `px-3.5` (14) on chips → `px-3` (12) — 4 is acceptable as a half-step; we'll standardize to multiples of 4 with majority on 8.
- `gap-1.5` (6) → `gap-2` (8)
- `gap-2.5` (10) → `gap-2` (8) or `gap-3` (12)
- `mb-1.5` (6) → `mb-2` (8)
- `py-3` (12) on Section trigger — keep (multiple of 4)
- `pb-4 pt-1` → `pb-4 pt-2`
- Outer `gap-4` (16), `px-5` (20) → keep `gap-4`; change `px-5` to `px-4` (16) for clean 8x grid.
- Duration buttons row uses `gap-2` (8) ✓; chip `px-4` ✓.

### Fix plan

**1. `src/components/mealplan/ConsiderationsScreen.tsx` — Chip component (line 30-48):**
```tsx
className={cn(
  "inline-flex items-center justify-center whitespace-nowrap",
  "h-11 px-4 rounded-full text-sm font-medium leading-none border",
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  selected
    ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
    : "bg-card text-foreground border-border shadow-sm hover:shadow-md"
)}
```
Changes: fixed `h-11` (44px) instead of `min-h`; `inline-flex items-center justify-center`; `whitespace-nowrap`; `leading-none` (prevents line-height shifts during font swap); `px-4` (16px, on grid); `transition-colors` only (not `transition-all`, which animates height/shadow and contributes to flicker).

**2. Same file — spacing normalization:**
- Outer wrapper (line 142): `gap-4 px-5` → `gap-4 px-4`
- All `mb-1.5` → `mb-2` (5 occurrences for section field labels)
- All `gap-1.5` → `gap-2` (currency row, period row)
- Section content padding `pb-4 pt-1` → `pb-4 pt-2`
- Section trigger `gap-2.5` → `gap-3`
- Duration row already on grid; ensure `gap-2` stays.

**3. Same file — duration toggle buttons (line 374-388):**
Apply the same height/flex pattern for visual consistency with chips: `h-11 inline-flex items-center justify-center whitespace-nowrap leading-none`.

### Files touched
- `src/components/mealplan/ConsiderationsScreen.tsx` (only file)

### Visual outcome
- Chips render at a stable 44px height from first paint, regardless of font-load state or browser.
- No mid-load wrap or jitter on long labels.
- All gaps/paddings/margins are multiples of 4, with primary spacing on 8 (gap-2, gap-4, mb-2, h-11, px-4).
