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
- `lib/flock/modes.ts` — the `MODES` config: **single source of truth** for all sim constants and scene colours
- `lib/flock/engine.ts` — imperative canvas engine (boids sim, scenes, veil transition)

## Conventions
- Sim behaviour is a faithful port of the prototype — change constants only in `MODES`, and only deliberately
- Fonts via `next/font/google` (Shippori Mincho B1, Zen Kaku Gothic New, DM Mono) exposed as `--font-*` variables
- Respect `prefers-reduced-motion` for CSS animations
- Copy voice: spare, sentence case, no emoji, no exclamation marks (see DS readme in the handoff bundle)
