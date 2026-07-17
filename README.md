# Ink Flock — Yūgen 幽玄

A full-screen interactive canvas: a boids flock — birds, koi, or antelope —
follows the cursor and scatters when you click, across three atmospheric scenes.
Built with Next.js 16 (App Router), React 19, and TypeScript, styled with the
Yūgen 幽玄 design system.

> **Move — they follow. Click — they scatter.**

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Other commands: `npm run build`, `npm run start`, `npm run lint`.

## Documentation

This README is a signpost. The docs are organised into four kinds — start with the
one that matches what you need.

### Tutorial — learning by doing
- [Getting started with Ink Flock](docs/tutorials/getting-started.md) — clone, run,
  and make your first visible change.

### How-to guides — solving a specific task
- [Add a new scene](docs/how-to/add-a-scene.md)
- [Record a showreel video](docs/how-to/record-a-showreel.md)

### Reference — the machinery, precisely
- [Scene contract](docs/reference/scene-contract.md) — `Agent`, `SceneConfig`,
  `Scene`, and the seam types.
- [Scene registry & mounting](docs/reference/scene-registry.md) — `SCENES`,
  `MODE_KEYS`, density/pace multipliers, `FlockCanvas` props, `FlockEngine` methods.
- [Design tokens](docs/reference/design-tokens.md) — the Yūgen colour, type,
  spacing, and effect tokens.

### Explanation — understanding why
- [Understanding the Ink Flock architecture](docs/explanation/architecture.md) — the
  engine/Scene seam, the frame flow, the veil transition, and the design rationale.

## Project layout

```
app/
  page.tsx            server component — mounts the experience
  layout.tsx          fonts + metadata
  styles/             Yūgen design-system tokens (colours, type, spacing, effects)
components/
  flock-canvas.tsx    client component — canvas + chrome (header, mode switch, captions)
lib/flock/
  engine.ts           scene-agnostic boids core
  types.ts            the Scene seam contract
  modes.ts            scene registry + global density/pace multipliers
  scenes/             one adapter per scene: birds, koi, safari
  dev-recorder.ts     dev-only video capture harness
```

## Conventions

- Simulation behaviour is a faithful port of the original prototype. Change physics
  constants only in the owning scene's `cfg`, and only deliberately.
- Adding a scene touches two files — a new adapter in `lib/flock/scenes/` and a line
  in `modes.ts`. See the [how-to](docs/how-to/add-a-scene.md).
- Styling uses the Yūgen design-system CSS custom properties in `app/styles/`; don't
  hardcode a colour that exists as a token.
- Copy voice is spare, sentence case, no emoji, no exclamation marks.

## Docs status

There is no `CONTEXT.md` or `docs/adr/` tree yet (a Phase-1 gap in the BleeQ
pipeline). The architectural rationale that would live there is currently captured
in [the architecture explanation](docs/explanation/architecture.md) and in the
inline comments across `lib/flock/`.
</content>
