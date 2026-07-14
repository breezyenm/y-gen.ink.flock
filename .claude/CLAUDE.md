# yũgen.ink.flock — Ink Flock

Full-screen interactive canvas experience: a boids flock (birds / koi / antelope) follows the cursor; click scatters it. Rebuilt with Next.js from the Claude Design handoff in `../interactive-cursor-with-animals/` (that `.dc.html` is the behaviour spec).

## Stack
- Next.js 16 App Router, TypeScript strict (no `any`), React 19
- Tailwind v4 present from scaffold, but styling is the **Yūgen 幽玄 design system** CSS custom properties in `app/styles/` — keep hex tokens as-shipped, never hardcode a colour that exists as a token
- No backend, no Firebase, no persistence — static single route

## Commands
- `npm run dev` / `npm run build` / `npm run lint`

## Structure
- `app/page.tsx` — server component, metadata + mounts the experience
- `components/flock-canvas.tsx` — client component: chrome (header, mode switcher, captions) + canvas
- `lib/flock/types.ts` — shared vocabulary: `Agent`, `SceneConfig`, and the **Scene seam** contract
- `lib/flock/scenes/{birds,koi,safari}.ts` — one adapter per scene: its constants (`cfg`), agent setup, behaviour decorations (trails, dust, ripples), and painting all live in that one file
- `lib/flock/modes.ts` — thin scene registry (`SCENES`, `MODE_KEYS`) + global density/pace multipliers
- `lib/flock/engine.ts` — scene-agnostic boids core: forces, target, veil transition, cursor, lifecycle

## Conventions
- Sim behaviour is a faithful port of the prototype — change constants only in the owning scene's `cfg`, and only deliberately
- To add a scene: write one file in `lib/flock/scenes/` implementing `Scene`, register it in `modes.ts` — the core and chrome need no edits beyond the `ModeKey` union
- Fonts via `next/font/google` (Shippori Mincho B1, Zen Kaku Gothic New, DM Mono) exposed as `--font-*` variables
- Respect `prefers-reduced-motion` for CSS animations
- Copy voice: spare, sentence case, no emoji, no exclamation marks (see DS readme in the handoff bundle)
