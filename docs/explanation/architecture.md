# Understanding the Ink Flock architecture

This document explains how the Ink Flock experience is put together and why it is
shaped the way it is. It is background reading, not a set of instructions — if you
want to *do* something (add a scene, record a video), follow a
[how-to guide](../how-to/) instead, and if you want the exact shape of a type,
read the [reference](../reference/).

## The one idea

Ink Flock is a single full-screen canvas. A flock of agents — birds, koi, or
antelope — follows the cursor and scatters when you click. There are three
visually distinct scenes, but there is only **one** flocking simulation.

That separation is the whole architecture. Everything the flock *is* physically —
how it steers, chases the cursor, respects edges, transitions between scenes — is
scene-agnostic and lives in one place. Everything a scene *looks and behaves like* —
its creatures, colours, backgrounds, trails, dust, ripples — lives behind a seam,
one adapter per scene.

```
                       ┌──────────────────────────────┐
   pointer / resize ──▶│  FlockEngine  (engine.ts)     │
                       │  boids forces · seek · scare  │
                       │  veil transition · cursor     │
                       │  rAF + input lifecycle        │
                       └───────────────┬──────────────┘
                                       │ Scene seam (types.ts)
                 ┌─────────────────────┼─────────────────────┐
                 ▼                     ▼                     ▼
          scenes/birds.ts       scenes/koi.ts        scenes/safari.ts
          cfg · initAgent       cfg · trails         cfg · band · dust
          drawBird              ripples · drawKoi    y-sort · drawAntelope
```

The engine never mentions a bird, a koi, or an antelope. A scene never runs a
physics step. The contract between them is the `Scene` interface.

## How a frame flows

The engine owns a `requestAnimationFrame` loop. Each tick, `step(now)`:

1. Computes a delta-time factor `k` clamped to `[0.3, 2.4]` so motion stays stable
   across frame rates, and reads the active scene's `cfg`.
2. Picks a **target**. If the pointer moved within the last 3 seconds, the target
   is the cursor; otherwise it is a slow idle drift (a Lissajous curve across the
   screen) so the flock keeps moving when nobody is watching.
3. Runs the boids inner loop over every agent — separation, alignment, cohesion,
   an orbit-seek toward the target, a scatter push if a recent click exists, a
   little wobble, edge margins, and an optional ground band — then integrates
   velocity and position and clamps speed.
4. Calls the scene's optional `afterAgentStep` (per agent) and `afterFrame` (once)
   hooks — this is where koi extend their trails, safari kicks up dust, and koi
   spawns ambient ripples.
5. Draws: clears the canvas, then `scene.drawBackground` → `scene.drawAgents` →
   the cursor ring → the veil overlay.

The agent model is deliberately flat and shared. Every agent carries position,
velocity, scale, alpha, and several phase accumulators (`phase`, `run`, `wob`,
`orbA`) that scenes read to animate wingbeats, gaits, and sway. Two fields are
scene-specific and optional: `tone` and `pts`, used only by koi. See
[the scene contract reference](../reference/scene-contract.md) for the exact
fields.

## The Scene seam

A scene is any object implementing `Scene`. It provides:

- `cfg` — a `SceneConfig`: the chrome strings (kanji, captions, ink/veil colours)
  **and** every physics constant the engine reads. The engine has no hardcoded
  numbers of its own; it steers entirely from the active scene's `cfg`.
- `initAgent` — adjusts a freshly built base agent (koi scales it up and gives it
  a tone and a trail; safari drops it into the ground band).
- `drawBackground` / `drawAgents` — painting, with the scene owning its own draw
  order.
- Optional behaviour hooks — `afterAgentStep`, `afterFrame`, `onPointerDown`,
  `reset`.

Because the seam is total, adding a scene touches exactly two files: a new adapter
in `lib/flock/scenes/` and a one-line registration in `modes.ts`. The engine and
the React chrome need no edits beyond widening the `ModeKey` union. That is the
payoff the design was built for; the [add-a-scene how-to](../how-to/add-a-scene.md)
walks it end to end.

### Why the seam is drawn here — and not elsewhere

The prototype this was rebuilt from (see `.claude/CLAUDE.md`) had all three scenes
tangled into one file, sharing mutable effect buffers. The rebuild's central
decision was to make the physics the stable core and push *everything* variable
behind the seam — including the constants. Two consequences worth knowing:

- **Constants live with the scene that owns them.** If a bird should bank harder,
  you change `wSep`/`maxForce` in `scenes/birds.ts`, never in the engine. The
  engine treating `cfg` as data is what keeps scenes independent.
- **Effect buffers are scene-owned, and that fixed a real bug.** In the prototype,
  clicking in Birds or Safari pushed entries onto a shared ripple array that only
  the Koi renderer ever pruned — a slow leak. Now the ripple buffer lives inside
  `KoiScene`, dust lives inside `SafariScene`, and `reset()` clears a scene's
  buffers when it becomes active. A scene cannot leak state into another scene
  because it has no reference to another scene's state.

## The veil transition

Switching scenes is not instant, and the timing matters for how the chrome stays
in sync. `requestMode(m)` starts a two-phase veil animation:

- **In (260 ms):** a full-screen rectangle in the *incoming* scene's veil colour
  fades from transparent to opaque. At the moment it reaches full opacity, the
  engine swaps the active scene, rebuilds its agents, and fires
  `onModeCommitted(m)`.
- **Out (420 ms):** the veil fades back to transparent, revealing the new scene.

The commit happening *mid-veil* — while the screen is fully covered — is why the
React component updates its `mode` state from the `onModeCommitted` callback rather
than optimistically on click: the caption and active-button indicator flip exactly
when the old scene is hidden, so the user never sees a mismatch. This mirrors the
prototype, which called `setState` from inside its draw-veil routine for the same
reason.

## Rendering and input

- **DPI:** `fit()` sizes the backing store to `devicePixelRatio` (capped at 2) and
  applies a matching transform, so drawing code works in CSS pixels while output
  stays crisp on retina displays.
- **Input:** the engine listens on `window` for `pointermove`, `pointerdown`, and
  `resize`. Pointer-down sets a transient `scare` (decays over 800 ms) that pushes
  agents away, and forwards to `scene.onPointerDown` (koi turns it into a ripple).
- **Cursor:** the app hides the native cursor (`cursor: none`) and the engine draws
  its own — a breathing ink ring plus a vermilion dot — which disappears after 3 s
  of no movement, the same threshold that hands the flock back to idle drift.

## The React layer is thin

`components/flock-canvas.tsx` is a client component that does three things: mounts
a `<canvas>`, constructs one `FlockEngine` in an effect (tearing it down on
unmount), and renders the chrome — the Yūgen wordmark, the three mode buttons, and
the per-scene caption. All of the chrome's colours come from the active scene's
`cfg`, so the UI recolours itself as scenes change. State is minimal: the committed
`mode` and a `flip` boolean that alternates the caption's keyframe name so the
fade re-runs on every commit. `app/page.tsx` is a server component that mounts the
canvas with the opening scene (`koi`, `sparse`, `drifting`).

## Deterministic capture (dev only)

The engine carries a second, dev-only driving path alongside the `rAF` loop:
`captureInit` / `captureSetScene` / `captureClick` / `captureFrame`. A headless
recorder calls these in a plain loop to advance the simulation one fixed-timestep
frame at a time, bypassing both `requestAnimationFrame` and the veil transition.
This exists because a headless browser renders the tab hidden, which pauses `rAF`
and freezes a real-time `captureStream`; stepping the sim by hand puts frame
timing fully under the recorder's control. None of this ships — it is wired in
only when `NODE_ENV !== "production"`. The
[record-a-showreel how-to](../how-to/record-a-showreel.md) covers using it.

## What is intentionally absent

There is no backend, no persistence, no data fetching, and no routing beyond the
single `/` page. Adding any of those would be a new axis the current architecture
does not account for. There is also no `CONTEXT.md` or `docs/adr/` tree yet; the
rationale that would live there is currently split between this document and the
inline comments in `lib/flock/`.
</content>
</invoke>
