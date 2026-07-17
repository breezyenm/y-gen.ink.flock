# Design token reference

The Yūgen 幽玄 design system tokens, defined as CSS custom properties in
[`app/styles/`](../../app/styles/) and imported by
[`app/globals.css`](../../app/globals.css). Reference these tokens rather than
hardcoding a colour or size that already exists as one.

Two colour usages coexist in this project:

- **Chrome** (React component + captions) reads scene colours from the active
  scene's `cfg` (`ink`, `veil`, `faint`) and a few semantic font/token variables.
- **Canvas** painting uses literal hex/rgba values inside each scene's draw code,
  chosen to match the token palette but not read from CSS (the 2D context cannot
  resolve CSS variables). When adjusting a scene's palette, keep those literals
  aligned with the token families below.

## Colour — [`colors.css`](../../app/styles/colors.css)

Raw scales are named after traditional Japanese colours (iro 色). Components should
reference the **semantic aliases**, not the raw scales.

### Raw scales

| Family | Meaning | Range | Base |
|--------|---------|-------|------|
| `--nando-*` | Deep jade-teal — the signature environment | `50`–`950` | `--nando-500` `#2C625E` |
| `--shu-*` | Vermilion — the single decisive accent | `50`–`900` | `--shu-500` `#D93A2B` |
| `--akari-*` | Amber lantern glow — warm secondary | `50`–`700` | `--akari-500` `#D9822A` |
| `--washi-*` | Paper/cream — light surfaces | `50`–`400` | — |
| `--sumi-*` | Ink — warm charcoal neutrals | `50`–`950` | — |

Functional: `--positive` `#4F7A52`, `--caution` `#D9822A`, `--critical` `#BC2E20`,
`--info` `#438580`.

### Semantic aliases

The default (light / washi) theme sets surface, text, accent, feature, border, and
focus aliases — e.g. `--surface-page`, `--text-strong`, `--accent`, `--feature`,
`--border-hair`, `--focus-ring`. A night theme overrides them under
`[data-theme="night"]`. Read the file for the full alias list and both themes.

> Note: the Ink Flock page itself does not apply `[data-theme="night"]` or lean on
> most semantic aliases — it paints directly to canvas and uses per-scene `cfg`
> colours. The token system is shipped in full for any additional surfaces (about
> pages, controls) added later.

## Typography — [`typography.css`](../../app/styles/typography.css)

Font families resolve through `next/font` variables set in `app/layout.tsx`.

| Token | Stack | Role |
|-------|-------|------|
| `--font-display` | Shippori Mincho B1 → serif | Headlines, quotes |
| `--font-sans` | Zen Kaku Gothic New → system-ui | UI / body |
| `--font-mono` | DM Mono → ui-monospace | Labels, meta, code |
| `--font-jp` | Shippori Mincho B1 → serif | Japanese accent / kanji |

Also defined: weight tokens (`--weight-light` … `--weight-black`), an editorial type
scale (`--text-3xs` `11px` … `--text-6xl` `120px`), line heights
(`--leading-tight` … `--leading-relaxed`), and letter-spacing tokens
(`--tracking-tight` … `--tracking-eyebrow` `0.22em`).

## Spacing — [`spacing.css`](../../app/styles/spacing.css)

A 4px base rhythm. Names map to pixels (`--space-4` = `4px` … `--space-160` =
`160px`). Semantic spacing (`--gap-inline`, `--gap-control`, `--gap-card`,
`--gap-section`, `--pad-control-*`, `--pad-card`) and container widths
(`--container-prose` `68ch`, `--container-narrow` `760px`, `--container` `1080px`)
build on it. Ma (間, negative space) is a brand value — prefer the larger step when
unsure.

## Effects — [`effects.css`](../../app/styles/effects.css)

Radii (`--radius-none` … `--radius-2xl`, plus `--radius-pill` and `--radius-circle`
for the sun/lantern disc), border widths, atmospheric "mist" shadows
(`--shadow-xs` … `--shadow-xl`), warm glows (`--glow-akari`, `--glow-shu`), and blur
tokens (`--blur-sm` … `--blur-lg`). Motion is slow and settling — never bouncy.

## Base — [`base.css`](../../app/styles/base.css)

Light-touch resets and brand defaults for raw HTML elements (headings default to the
display mincho, body to sans). Components do not depend on these; they exist for
documents and prototypes.

## Page shell

`app/globals.css` adds the Ink Flock page shell on top of the tokens: a fixed
full-height washi background, the caption fade keyframes (`ygFadeA` / `ygFadeB`),
the `.yg-mode-btn` hover treatment, and a `prefers-reduced-motion` block that
disables all animation.
</content>
