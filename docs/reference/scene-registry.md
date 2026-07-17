# Scene registry & mounting reference

The registry that assembles scenes and the global simulation multipliers
([`lib/flock/modes.ts`](../../lib/flock/modes.ts)), plus the props for mounting the
experience ([`components/flock-canvas.tsx`](../../components/flock-canvas.tsx)).

## `SCENES`

```ts
const SCENES: Record<ModeKey, Scene>
```

Maps each `ModeKey` to its scene instance:

| Key | Instance | File |
|-----|----------|------|
| `birds` | `birdsScene` | [`scenes/birds.ts`](../../lib/flock/scenes/birds.ts) |
| `koi` | `koiScene` | [`scenes/koi.ts`](../../lib/flock/scenes/koi.ts) |
| `safari` | `safariScene` | [`scenes/safari.ts`](../../lib/flock/scenes/safari.ts) |

## `MODE_KEYS`

```ts
const MODE_KEYS: ModeKey[] = ["birds", "koi", "safari"]
```

Registry order. Drives the mode-button order in the chrome and the scene order in
the capture harness.

## `DENSITY_MUL`

```ts
const DENSITY_MUL: Record<Density, number> = { sparse: 0.55, natural: 1, abundant: 1.7 }
```

Multiplied against a scene's `cfg.count` when the engine builds the flock. The
result is floored at 3 agents: `n = max(3, round(count * DENSITY_MUL[density]))`.

## `PACE_MUL`

```ts
const PACE_MUL: Record<Pace, number> = { drifting: 0.72, natural: 1, lively: 1.38 }
```

Multiplied against `cfg.maxSpeed` and `cfg.maxForce` each tick, and folded into the
animation-phase advance so wingbeats and gaits scale with pace.

## `FlockCanvas` props

The client component that mounts the experience.

```tsx
import { FlockCanvas } from "@/components/flock-canvas";

<FlockCanvas startMode="koi" density="sparse" pace="drifting" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startMode` | `ModeKey` | `"koi"` | Scene shown on first mount |
| `density` | `Density` | `"sparse"` | Flock size multiplier |
| `pace` | `Pace` | `"drifting"` | Speed/force multiplier |

The component constructs a single `FlockEngine` in a mount effect and destroys it
on unmount. Changing any prop tears down and rebuilds the engine (the props are the
effect's dependencies). In development it also lazy-loads the capture harness; see
the [record-a-showreel how-to](../how-to/record-a-showreel.md).

`app/page.tsx` mounts it with the shipped opening configuration:
`startMode="koi"`, `density="sparse"`, `pace="drifting"`.

## `FlockEngine` public methods

Constructed as `new FlockEngine(canvas, options)` where options are
`{ startMode, density, pace, onModeCommitted }`.

| Method | Description |
|--------|-------------|
| `start()` | Attach input listeners, size the canvas, build agents, begin the `rAF` loop |
| `destroy()` | Cancel the loop and detach all listeners |
| `requestMode(m)` | Begin a veil transition into scene `m`; ignored if already there or mid-fade-in |

`onModeCommitted(mode)` fires mid-veil, at the instant the new scene becomes active
(see [the veil transition](../explanation/architecture.md#the-veil-transition)).
The remaining `capture*` methods are dev-only; see the
[record-a-showreel how-to](../how-to/record-a-showreel.md).
</content>
