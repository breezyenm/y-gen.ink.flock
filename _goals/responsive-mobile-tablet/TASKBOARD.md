# Taskboard — Responsiveness for mobile & tablet

> **Live state.** Mirrors CHECKLIST at open; mutates during walk/audit. The diff between this
> and CHECKLIST is the honest record of scope drift.

**Goal status:** complete
**Next operation:** — (all operations complete)
**Last updated:** 2026-07-16

## Operations

### 1. Responsive interface derivation — `interface-ten-star` (audit mode)
- **Status:** complete
- **Depends on:** —
- **Completion criteria:** ✓ build-ready brief; ✓ zone/flow/state diagrams; ✓ fixed-dimension
  strategy (viewport scale factor `s`, `s=1` at desktop).
- **Files touched:** `_goals/responsive-mobile-tablet/interface-brief.md` (new)
- **Findings:** Thesis = "a calm full-bleed instrument you play with a fingertip." Key calls:
  finger=cursor while touching + ring under finger; two-row mobile header (nav stays top,
  bottom = play field); teach-once-then-recede hint; viewport scale factor for sim geometry
  (`s=1` at desktop preserves faithful port); reduced-motion = interactive-but-no-autonomy.
  6 taste calls parked in the brief's open questions.
- **plan-impact:** advisory — sequence confirmed; open questions to weigh before/at build.

### 2a. Persona pack — `persona-pack-builder`
- **Status:** complete
- **Depends on:** 1
- **Completion criteria:** ✓ Tier 1.5 research-grounded pack, provenance-tagged; ✓ zero-
  customer incumbent reframe; ✓ "what would upgrade this pack" section.
- **Files touched:** `_goals/responsive-mobile-tablet/persona-pack.md` (new)
- **Findings:** 3 personas — thumb-scroller (impatient mobile lander; make-or-break =
  discovery cliff), lingerer (tablet explorer; expects locality the global-target sim doesn't
  give), sensitive-one (reduced-motion; validates rAF loop must honour the setting, not just
  CSS). Two `[web]` anchors: (1) non-signified gestures have a systematic discoverability gap
  → first-touch cue is load-bearing; (2) touch-unmapped hover/drag → high bounce, fast clear
  feedback retains → `@media (hover:hover)` guard + ring-under-finger on first move.
- **plan-impact:** advisory — confirms brief; hands build concrete notes (hover guard, instant
  feedback, discovery cue).

### 2b. Mobile user-walkthrough — `user-walkthrough-lens`
- **Status:** complete
- **Depends on:** 2a
- **Completion criteria:** ✓ 3 personas walked cold + session-arc; ✓ 6 holes w/ severity +
  provenance + novelty diff; ✓ brief revisions (R1–R3) fed back.
- **Files touched:** `_goals/responsive-mobile-tablet/walkthrough-holes.md` (new);
  `interface-brief.md` (§8b revisions + Q7)
- **Findings:** 2 NOVEL — H2 (tap-first = flock recoils, reads as rejection), H3 (reduced-
  motion removes the ambient motion that signals interactivity → page looks dead). H1 sharpen:
  discovery cue must be a live flock response, not passive text. Passes: nav-stays-top,
  ring-under-finger, `s=1` desktop guarantee.
- **plan-impact:** advisory + **one decision for user (H2 / Q7)** — first-contact ordering must
  be settled before build; does not replan the sequence.

### 3. Build the retrofit — `tdd`
- **Status:** complete
- **Depends on:** 1 (+ 2 findings)
- **Completion criteria:**
  - ✓ Touch input: drag-to-lead + tap-scatter; mouse path untouched (pointerType split);
    tap-vs-drag via tested `classifyGesture` (10px / 250ms).
  - ✓ Responsive chrome: two-row header ≤640px, ≥44px targets, `@media(hover:hover)` cursor
    guard, `touch-action:none`, dual hint copy, first-touch fade / reduced-motion static hint.
  - ✓ Density & force scaling via tested `viewportScale`/`scaledCount` — `s=1` & full count at
    desktop (faithful port); phones scale spatial constants + count.
  - ✓ `prefers-reduced-motion` honoured in the rAF loop (freeze-until-touch, instant scene cut).
  - ✓ Orientation / `visualViewport` re-fit with agent clamp (no rebuild on rotate).
  - ✓ `tsc --noEmit` clean; ✓ 12/12 unit tests; lint has only the pre-existing dev-recorder
    warning. ⚠ `npm run build` blocked by offline Google-Fonts fetch (environmental, untouched
    `layout.tsx`) — retry with network in Op4.
- **Files touched:** `lib/flock/responsive.ts` (new), `lib/flock/responsive.test.ts` (new),
  `lib/flock/engine.ts`, `components/flock-canvas.tsx`, `app/globals.css`, `package.json`
  (vitest + `test` script).
- **Findings:** Faithful-port preserved by construction — mouse input path and `s=1`/full-count
  at desktop mean the shipped desktop sim is unchanged. All scaled constants documented inline.
- **plan-impact:** none — built within scope; visual/interaction proof deferred to Op4.

### 4. Verification — browser preview
- **Status:** complete
- **Depends on:** 3
- **Completion criteria:** ✓ driven at 375 / 768 / 1280; ✓ touch path fires (synthetic);
  ✓ collision fixed; ✓ desktop regression clean (no h-scroll, single row, cursor:none);
  ✓ screenshots. Reduced-motion + hover:none touch-copy are device-only (emulator can't show).
- **Files touched:** `_goals/responsive-mobile-tablet/verification.md` (new);
  `app/globals.css` (mobile hint/caption collision fix found during verify).
- **Findings:** One real bug caught + fixed live — caption/hint overlap at 375px. Everything
  else passed. Two checks deferred to a real device (touch-copy swap, reduced-motion freeze).
- **plan-impact:** none — goal complete.
