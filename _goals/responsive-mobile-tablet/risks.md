# Risks — Responsiveness for mobile & tablet

- **Sim-constant drift.** Viewport density/force scaling risks diverging from the faithful
  port. Mitigation: document every change with rationale; desktop regression check in verify.
- **Tap-vs-drag ambiguity.** A lead-drag that starts with a near-still finger could fire a
  scatter, or a scatter-tap could nudge the flock. Mitigation: movement + time threshold,
  tuned in build and walked in verification.
- **Mobile viewport units.** `100vh` / URL-bar resize and `visualViewport` can mis-size the
  canvas or shift chrome. Mitigation: rely on `clientWidth/Height` + resize (already), add
  orientation/visualViewport handling, verify in both orientations.
- **Discoverability.** Drag-to-lead is invisible without a hover cue. Mitigation: user-
  walkthrough operation explicitly tests this; may add a first-touch affordance.
- **Passive listener / scroll-jank.** Touch handlers may need `touchAction: none` /
  non-passive to prevent page pan-zoom stealing the gesture. Flag during build.
