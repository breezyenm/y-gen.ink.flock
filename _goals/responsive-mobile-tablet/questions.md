# Open questions — Responsiveness for mobile & tablet

## Resolved
- **Touch interaction model?** → drag to lead + tap to scatter (idle-drift when idle).
  Resolved by user, 2026-07-16.
- **How much rigor before build?** → full (interface derivation + mobile walkthrough).
  Resolved by user, 2026-07-16.

## Open (for the interface-derivation operation to settle)
- Mode switcher on mobile: keep 3 labelled buttons, collapse to kanji-only, or move to a
  bottom bar / sheet? (interface-ten-star to propose.)
- Does the bottom-right hint stay on touch, and does its copy change ("drag — they follow ·
  tap — they scatter")? Copy voice: spare, sentence case, no emoji/exclamation.
- Tap-vs-drag threshold (movement + time) to avoid accidental scatter while leading.
- Is a first-touch hint / affordance needed so the drag-to-lead is discoverable?
- Density target per breakpoint — scale by area, by a fixed per-breakpoint multiplier, or
  cap count? (Must stay within faithful-port discipline.)
