# How to add a new scene

This guide adds a fourth scene to the flock. Adding a scene touches exactly two
files: a new adapter in `lib/flock/scenes/` and one line in `modes.ts`. The engine
and the React chrome need no changes beyond widening the `ModeKey` union.

This guide assumes you know TypeScript and the Canvas 2D API. For the shape of the
types used below, see the [scene contract reference](../reference/scene-contract.md);
for why the seam is drawn this way, see the
[architecture explanation](../explanation/architecture.md).

The example adds a `moths` scene. Substitute your own key and creature throughout.

## 1. Add the key to the `ModeKey` union

In [`lib/flock/types.ts`](../../lib/flock/types.ts):

```ts
export type ModeKey = "birds" | "koi" | "safari" | "moths";
```

This is the only edit outside your scene file and the registry — TypeScript will
now flag the registry as incomplete until you register the scene in step 3.

## 2. Write the scene adapter

Create `lib/flock/scenes/moths.ts`. A scene is a class implementing `Scene`,
exported as a singleton. Start from this skeleton:

```ts
import type { Agent, Scene, SceneConfig, SeededFn } from "../types";

const cfg: SceneConfig = {
  // Chrome
  kanji: "蛾",
  label: "Moths",
  ja: "「夜の蛾」",
  en: "Drawn to the lantern",
  ink: "#F3E9D2",
  veil: "#0B0A12",
  faint: "rgba(243,233,210,0.45)",
  // Flock physics — start by copying a scene that moves like yours,
  // then tune. Change these numbers deliberately.
  count: 30,
  maxSpeed: 3.2,
  maxForce: 0.13,
  minSpeed: 0.8,
  rSep: 24,
  rAli: 50,
  rCoh: 80,
  wSep: 1.6,
  wAli: 0.8,
  wCoh: 0.6,
  wSeek: 0.9,
  arrive: 120,
  orbit: 60,
};

function drawMoth(ctx: CanvasRenderingContext2D, a: Agent) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(Math.atan2(a.vy, a.vx));
  ctx.scale(a.s, a.s);
  // ... paint using a.phase for wingbeat, a.al for alpha ...
  ctx.restore();
}

class MothsScene implements Scene {
  readonly key = "moths" as const;
  readonly cfg = cfg;

  initAgent() {
    // The base agent is already usable; adjust scale/spawn here if needed.
  }

  drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, seeded: SeededFn) {
    void seeded; // use it for static decor, or drop the param
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#141222");
    g.addColorStop(1, "#0B0A12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[]) {
    for (const a of agents) drawMoth(ctx, a);
  }
}

export const mothsScene = new MothsScene();
```

Guidance:

- **Physics constants live here, not in the engine.** Tune movement by editing this
  `cfg`. Copy the `cfg` of whichever shipped scene moves closest to what you want
  (birds = fast and banking, koi = slow and gliding, safari = grounded) and adjust.
- **Use the agent's phase accumulators for animation.** `a.phase` and `a.run`
  advance every tick (with speed and pace folded in) — read them for wingbeats or
  gaits so motion stays frame-rate independent. Don't call `performance.now()`
  yourself for per-agent animation; the `now` passed to `drawAgents` is there if
  you need a shared clock.
- **Own any effect state, and clear it in `reset()`.** If your scene keeps a buffer
  (trails, particles, ripples), store it as a private field and implement `reset()`
  to empty it. This is what keeps scenes from leaking state into one another — see
  koi's ripple buffer for the pattern. A scene without effect state can skip
  `reset()`.
- **Optional hooks** — implement `afterAgentStep` (per agent, receives speed),
  `afterFrame` (once per tick), and `onPointerDown` only if you need them. Koi uses
  all three; birds uses none.
- **Constrain to a ground band** by adding a `band` to `cfg` and honouring
  perspective in your draw code, the way safari does.

## 3. Register the scene

In [`lib/flock/modes.ts`](../../lib/flock/modes.ts), import the singleton and add it
to both `SCENES` and `MODE_KEYS`:

```ts
import { mothsScene } from "./scenes/moths";

export const SCENES: Record<ModeKey, Scene> = {
  birds: birdsScene,
  koi: koiScene,
  safari: safariScene,
  moths: mothsScene,
};

export const MODE_KEYS: ModeKey[] = ["birds", "koi", "safari", "moths"];
```

`MODE_KEYS` order determines the mode-button order in the chrome. That is the last
edit — the mode switcher renders a button for every key automatically.

## 4. Verify

```bash
npm run lint
npm run dev
```

Open the app, and your scene's button appears in the top-right switcher. Click it:
the veil should fade in its colour, the flock should rebuild as your creature, and
the caption should flip to your `ja`/`en` strings. Move the cursor to confirm the
flock follows; click to confirm it scatters.

If TypeScript complains that `SCENES` or a `Record<ModeKey, …>` is missing a key,
you added the `ModeKey` but not the registry entry — finish step 3.
</content>
