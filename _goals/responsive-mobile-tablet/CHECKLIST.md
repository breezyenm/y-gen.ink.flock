# Goal — Responsiveness for mobile & tablet screen sizes

> **Frozen approved scope.** Client-shareable. Source of truth for "what we said we'd do."
> Locked 2026-07-16. Do not edit after approval — live state mutates in TASKBOARD.md.

## Scope

Make the Ink Flock full-screen canvas experience work correctly and feel intentional on
mobile and tablet viewports, not only desktop pointer/hover. Covers the interaction model
(touch), the chrome layout (header, mode switcher, captions, hint), and the simulation's
visual density at small sizes — plus reduced-motion and orientation handling.

Breakpoints (working definition, refined in the audit operation):
- **mobile** ≤ 640px
- **tablet** 641–1024px ("tab")
- **desktop** > 1024px

## Decisions locked at planning

- **Touch interaction model:** drag to lead (finger down + move → flock follows the touch
  point), quick tap → scatter. Idle-drift takes over when not touching. Requires
  tap-vs-drag disambiguation.
- **Rigor:** full — an interface-derivation pass and a mobile user-walkthrough run *before*
  build, not a mechanical retrofit.

## Operations (approved sequence)

1. **Responsive interface derivation** — `interface-ten-star` (audit mode)
   Audit the current UI at mobile/tablet; derive the best small-screen form: chrome reflow,
   the drag-to-lead/tap-scatter touch model, and a density/scale strategy for the sim.
   → build-ready interface brief + layout/interaction diagram.

2. **Mobile user-walkthrough** — `persona-pack-builder` → `user-walkthrough-lens` (paired)
   - **2a. Persona pack** (`persona-pack-builder`): build a grounded pack for mobile/tablet
     users of an ambient interactive canvas — grounded in incumbents (interactive art sites,
     generative/ambient toys, museum installations) since this is a zero-customer surface.
     Provenance-tagged, tier-labelled. This is the required input to 2b, not a ghost built
     inline by the lens.
   - **2b. Walkthrough** (`user-walkthrough-lens`): the pack's personas walk the flow on
     touch; surface hesitation, invisible affordances (hover-only cues), tap-vs-drag
     confusion, and whether "they follow me" value lands. Any brief revisions feed build.

3. **Build the retrofit** — `tdd`
   Implement against the brief: touch input in the engine (drag-to-lead / tap-scatter),
   responsive chrome (breakpoint reflow of header / mode switcher / captions / hint),
   deliberate + documented density & force scaling per viewport, `prefers-reduced-motion`
   in the rAF loop, and orientation / `visualViewport` handling.

4. **Verification** — browser preview
   Drive the running app at mobile / tablet / desktop viewports and in reduced-motion;
   confirm touch drag + tap, no chrome overflow/collision, acceptable density, and that the
   sim behaviour is unchanged where it must be. Share visual proof.

## Out of scope

- New scenes, new sim behaviours, or gameplay changes beyond the touch input model.
- Backend / persistence / analytics (none exist; this stays a static single route).
- Desktop redesign — desktop must remain visually and behaviourally as-shipped.
- Retuning sim constants for their own sake — only viewport-driven scaling, done deliberately.

## Completion criteria (goal-level)

- The experience is usable and legible on a phone and a tablet, in both orientations.
- Touch users can lead the flock and scatter it; the interaction is discoverable.
- No chrome overflow, clipping, or collision at any supported viewport.
- `prefers-reduced-motion` is honoured by the canvas loop, not just CSS.
- Desktop output is unchanged (visual + behavioural regression check passes).
- Sim-constant changes, if any, are documented with rationale (faithful-port discipline).
