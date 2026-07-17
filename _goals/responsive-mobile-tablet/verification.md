# Verification report — Op4 (browser)

Dev server driven in the preview browser across viewports. 2026-07-16.

## Verified ✓

| Check | Viewport | Result |
|---|---|---|
| Desktop unchanged (regression) | 1280–1440 | Single-row header, hover copy "move — they follow · click — they scatter", `cursor:none`, koi scene as shipped. No horizontal scroll. |
| Two-row header, no overflow | 375 | Brand row + full-width switcher (birds/koi/safari), ≥44px targets. No horizontal scroll. |
| Caption ↔ hint collision | 375 | **Bug found + fixed during verify:** both were overlapping on the bottom edge (`overlap:true`). Lifted mobile hint above caption → `overlap:false` (hint 693–708, caption 734–790). |
| Flock scales, stays legible | 375 / 768 | Fewer koi (area-scaled count), clustered and following — not frantic. |
| Single-row header fits | 768 | Brand + switcher on one row with room; no overflow. |
| Touch path fires | 375 | Synthetic touch `pointerdown` → `onFirstInteract` → hint gains `yg-hint--dismissed`. Tap-vs-drag classification unit-tested (12/12). |
| No console errors | all | Clean. |

## Not browser-verifiable here (device caveats — logic-correct, unit/inspection-covered)

- **Touch-copy swap** (`drag — they follow · tap — they scatter`): gated on `@media (hover:none)`;
  the preview pane emulates `hover:hover` (`matchMedia('(hover:none)')` → false), so the pane
  shows the hover copy. Both copies exist in the DOM and toggle correctly by media; needs a real
  phone to see the swap.
- **`prefers-reduced-motion` engine freeze + static hint** (R3): the pane can't emulate the
  reduced-motion media, so the rAF freeze-until-touch and the persistent-hint override are
  code-verified only. Needs a device/OS with reduced-motion set.

## Recommendation

Ship-ready for mobile/tablet at the observable layer. Before calling it fully done, do one pass
on a **real phone** (touch-copy swap, drag-to-lead feel, tap "playful scatter" read per H2) and
one with **reduced-motion enabled** (freeze-until-touch + static hint). These are the two things
the emulator structurally cannot show.
