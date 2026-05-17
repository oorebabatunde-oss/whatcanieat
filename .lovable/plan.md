# Fix low-contrast text

The accessibility scan flagged text that doesn't meet WCAG AA contrast (4.5:1 for body, 3:1 for large text). Two spots in the codebase use faded utility classes on top of already-muted colors, which fail contrast on the light off-white background.

## Changes

1. **`src/components/quiz/ResultsScreen.tsx` (line 349)** — the AI-disclaimer subtitle under the swipe hint uses `text-muted-foreground/60 text-[11px]`. The `/60` opacity on top of muted grey, at 11px, fails AA. Drop the opacity (use full `text-muted-foreground`) and bump to `text-[12px]` so it still reads as fine print but meets contrast.

2. **`src/components/quiz/SwipeCard.tsx` (line 119)** — the image source/credit pill uses `bg-foreground/40` with `text-background/80`. Both translucent layers blend with the photo behind, leaving the label illegible. Switch to solid `bg-foreground/80` with `text-background` so the chip reads on any image.

## Out of scope

Other `/50`-style opacities in the codebase (Radix calendar disabled days, dropdown disabled items, dialog close button) are standard shadcn defaults on interactive/disabled states and are not what the Lighthouse audit is flagging.

## After approval

Two small edits, then surface the publish dialog so the fix lands on the live site (the SEO finding is scored against the published version) and mark the finding fixed.
