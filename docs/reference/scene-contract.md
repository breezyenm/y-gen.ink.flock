# Scene contract reference

The types that define the seam between the scene-agnostic engine and each scene.
All are declared in [`lib/flock/types.ts`](../../lib/flock/types.ts). This page
describes them; to learn *why* the seam exists see
[the architecture explanation](../explanation/architecture.md), and to build a
scene see [the add-a-scene how-to](../how-to/add-a-scene.md).

## Unions

| Type | Values |
|------|--------|
| `ModeKey` | `"birds" \| "koi" \| "safari"` |
| `Density` | `"sparse" \| "natural" \| "abundant"` |
| `Pace` | `"drifting" \| "natural" \| "lively"` |
| `KoiTone` | `"shu" \| "akari" \| "jade" \| "washi"` |

## `Pt`

A 2D point.

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | X coordinate, CSS pixels |
| `y` | `number` | Y coordinate, CSS pixels |

## `Agent`

One flock member. The engine builds every agent from the same base shape and
mutates it in place each tick; scenes read these fields when painting. All
coordinates and velocities are in CSS pixels.

| Field | Type | Description |
|-------|------|-------------|
| `x`, `y` | `number` | Position |
| `vx`, `vy` | `number` | Velocity |
| `s` | `number` | Scale multiplier applied by the scene's draw code |
| `al` | `number` | Alpha (opacity) baseline for the agent |
| `phase` | `number` | Accumulator for cyclic animation (e.g. wingbeat, sway) |
| `run` | `number` | Accumulator advanced by speed (e.g. gait) |
| `wob` | `number` | Random-walk accumulator driving the wobble force |
| `orbA` | `number` | Orbit angle around the seek target |
| `orbR` | `number` | Per-agent orbit radius factor (`0.35`–`1.0`) |
| `dir` | `number` | Facing sign, `1` or `-1`; set from velocity when `|vx| > 0.25` |
| `tone?` | `KoiTone` | Koi only: body colour family |
| `pts?` | `Pt[]` | Koi only: trail points, head first |

The base agent produced by the engine's `build()` has randomised `x`, `y`, `vx`,
`vy`, `s` (`0.72`–`1.32`), `al` (`0.62`–`0.95`), and phase accumulators, with
`dir = 1`. A scene's `initAgent` adjusts this base — for example koi overwrites
`s` and seeds `pts`, safari overwrites `y` and `s`.

## `BandSpec`

A vertical band that agents (and the seek target) are held within. Used by safari
to keep the herd on the ground strip.

| Field | Type | Description |
|-------|------|-------------|
| `topFrac` | `number` | Band top as a fraction of canvas height |
| `topPad` | `number` | Pixels added below `topFrac * h` |
| `botPad` | `number` | Pixels of padding above the bottom edge |

### `bandOf(band, h)`

```ts
function bandOf(band: BandSpec, h: number): { top: number; bot: number }
```

Resolves a `BandSpec` against a canvas height `h` into absolute `top`/`bot`
pixel bounds: `top = h * topFrac + topPad`, `bot = h - botPad`.

## `SceneConfig`

Everything the engine and chrome read for a scene: presentation strings plus every
physics constant. The engine holds no physics numbers of its own — it steers
entirely from the active scene's `cfg`.

### Chrome

| Field | Type | Description |
|-------|------|-------------|
| `kanji` | `string` | Scene glyph shown in the mode button (e.g. `"鳥"`) |
| `label` | `string` | Scene name (e.g. `"Birds"`) |
| `ja` | `string` | Japanese caption, bottom-left |
| `en` | `string` | English caption, bottom-left |
| `ink` | `string` | Foreground/UI colour for this scene's chrome |
| `veil` | `string` | Full-screen colour used for the transition into this scene |
| `faint` | `string` | Dimmed ink for inactive mode buttons |

### Flock physics

| Field | Type | Description |
|-------|------|-------------|
| `count` | `number` | Base agent count (before the density multiplier) |
| `maxSpeed` | `number` | Speed ceiling (before the pace multiplier) |
| `maxForce` | `number` | Steering-force ceiling (before the pace multiplier) |
| `minSpeed` | `number` | Speed floor; agents never fully stop |
| `rSep` | `number` | Separation radius |
| `rAli` | `number` | Alignment radius |
| `rCoh` | `number` | Cohesion radius |
| `wSep` | `number` | Separation weight |
| `wAli` | `number` | Alignment weight |
| `wCoh` | `number` | Cohesion weight |
| `wSeek` | `number` | Weight of the orbit-seek toward the target |
| `arrive` | `number` | Distance at which seek speed starts easing to zero |
| `orbit` | `number` | Orbit radius around the target |
| `orbitYScale?` | `number` | Flattens the orbit ellipse vertically (default `1`) |
| `band?` | `BandSpec` | Constrains agents and the target to a ground band |

For the concrete values each shipped scene uses, read the `cfg` at the top of the
scene's file: [`birds.ts`](../../lib/flock/scenes/birds.ts),
[`koi.ts`](../../lib/flock/scenes/koi.ts),
[`safari.ts`](../../lib/flock/scenes/safari.ts).

## `SeededFn`

```ts
type SeededFn = (n: number, salt: number) => number[][]
```

A deterministic pseudo-random source the engine passes into `drawBackground`. Each
call returns `n` rows of four numbers in `[0, 1)`, seeded from the canvas size and
`salt`. Scenes use it to place static decor (koi surface streaks, safari grass)
that stays put across frames but reshuffles on resize. Cache the result — the
shipped scenes memoise it in a `decor` field and only recompute when the field is
null.

## `Scene`

The interface every scene implements.

| Member | Signature | Required | Purpose |
|--------|-----------|----------|---------|
| `key` | `ModeKey` | yes | Identity; must match the registry key |
| `cfg` | `SceneConfig` | yes | Presentation + physics constants |
| `initAgent` | `(a, i, w, h) => void` | yes | Adjust a freshly built base agent |
| `afterAgentStep` | `(a, sp, now) => void` | no | Per-agent, per-tick hook (trails, dust) |
| `afterFrame` | `(agents, now) => void` | no | Once-per-tick hook (ambient effects) |
| `onPointerDown` | `(x, y, now) => void` | no | Pointer-down effect (e.g. koi ripple) |
| `reset` | `() => void` | no | Clear scene-owned effect state on activation |
| `drawBackground` | `(ctx, w, h, seeded) => void` | yes | Paint the backdrop |
| `drawAgents` | `(ctx, agents, now, w, h) => void` | yes | Paint agents + effects; owns draw order |

Notes:

- `initAgent` receives the agent index `i` and canvas size `w`, `h`. Index is how
  koi assigns tones (agent 0 → `shu`, agent 1 → `akari`, every fourth → `jade`,
  rest → `washi`).
- `afterAgentStep` receives the agent's current speed `sp` and timestamp `now`;
  safari uses `sp` to gate dust emission.
- `reset` is called both when a scene becomes active via the veil and at capture
  init. Clear any effect buffers here so they never carry across activations.
- `drawAgents` owns draw order within the scene layer — safari y-sorts its herd
  and paints dust first; koi paints ripples before fish.

The engine draws the cursor and veil *after* `drawAgents`, so a scene never needs
to account for them.
</content>
