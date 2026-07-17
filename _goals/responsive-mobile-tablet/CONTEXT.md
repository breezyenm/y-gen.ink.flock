# Context — Responsiveness for mobile & tablet

Goal-scoped context. Assembled at planning, 2026-07-16.

## The surface

- `app/page.tsx` — server component, mounts `<FlockCanvas startMode="koi" density="sparse" pace="drifting" />`.
- `components/flock-canvas.tsx` — client component: canvas element + all chrome (header,
  mode switcher, captions, hint). All layout is **inline styles with hardcoded px** —
  padding `26px 36px`, font sizes 19/30/11/10, absolute `left/right: 36`, `bottom: 34/36`.
- `lib/flock/engine.ts` — scene-agnostic boids core. Owns input + sizing:
  - `fit()` already does DPR (`min(2, dpr)`) + `clientWidth/Height`, listens on `resize`.
  - Input is **hover-native**: `pointermove` → target ("they follow"), `pointerdown` →
    scatter. Drawn cursor ring + `cursor:none`. No touch-specific path.
  - rAF loop does **not** check `prefers-reduced-motion`.
  - Forces use absolute px: edge margin `M=70`, orbit radius, `rSep/rAli/rCoh`.
- `lib/flock/scenes/{birds,koi,safari}.ts` — per-scene `cfg` (count, speeds, radii). Agent
  `count` × `DENSITY_MUL` sets population regardless of viewport area.
- `app/styles/` — Yūgen design tokens (colors, spacing on a 4px rhythm, type). Spacing has
  container widths but **no breakpoint tokens and only one `@media` (reduced-motion) in
  `app/globals.css:47`**.

## What makes this non-trivial (found in planning)

1. **Touch has no hover.** The core "move — they follow" is a mouse metaphor. On touch,
   `pointermove` only fires while a finger is down. → new interaction model (decided below).
2. **Chrome is desktop-fixed.** Single-row header with brand + 3-button mode switcher and
   `justify-content: space-between` will crowd/wrap on a phone; px type doesn't scale;
   bottom-left captions and bottom-right hint can collide on narrow screens.
3. **Density is area-blind.** Same agent count in a small viewport reads as frantic; forces
   tuned in desktop px. CLAUDE.md: sim constants change only **deliberately**.

## Decisions made during planning

- **Touch model:** drag to lead (finger down + move → flock follows touch point), quick tap
  → scatter; idle-drift when not touching. (User, 2026-07-16.)
- **Rigor:** full — interface derivation + mobile walkthrough before build. (User, 2026-07-16.)

## Constraints / scope limits

- **Faithful-port discipline** (from `.claude/CLAUDE.md`): the sim is a faithful port of the
  prototype. Any density/force scaling must be viewport-driven and documented, not casual.
- **Desktop must not regress** — visual and behavioural output at desktop stays as-shipped.
- **No new colours** outside the Yūgen tokens; no backend/persistence.
- **This is not the Next.js you know** (`AGENTS.md`): consult `node_modules/next/dist/docs/`
  before writing framework-touching code.

## Brain consult (2026-07-16, Phase A — advisory)

- **Gap:** the brain has no pattern for responsive canvas / touch interaction. Fresh
  decisions; a future dream can lift them back in.
- Nearest neighbour `one-brand-core-multiple-structural-dialects` (design) does **not** apply
  — it's for multi-app families, not a single canvas surface.
