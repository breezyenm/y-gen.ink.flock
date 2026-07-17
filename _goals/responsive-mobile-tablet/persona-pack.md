# Persona pack — Ink Flock on touch (mobile & tablet)

> Op2a deliverable (`persona-pack-builder`). Evaluation personas for walking the flow, not
> marketing segments. **Tier 1.5 — research-grounded, pre-launch / zero-customer** (grounded
> in the incumbents this piece sits among). 2026-07-16.

## Skeleton (from spec)

- **Surface:** one full-bleed interactive canvas — no auth, no accounts, no multi-role. `[spec]`
- **Role:** a single human — a *visitor* who lands on an ambient art piece. Split here by
  device context (phone vs. tablet) and by motion sensitivity, because those change behaviour. `[spec]`
- **Vertical:** interactive digital art / ambient generative toy / portfolio-grade web piece. `[spec]`
- **Flow:** land → notice motion → *discover they can influence it* (drag to lead) → play →
  maybe switch scene → leave. The pivot is the discovery step. `[spec]`

**Pre-launch reframe:** the job — "be quietly delighted by an ambient interactive thing" —
already exists, done by the users of interactive-art sites (Awwwards/Codrops-class WebGL toys),
ambient generative apps, and museum touch installations. Those users are the grounding source.

## Make-or-break selection

Not one persona per role (there's one role). The three whose friction actually kills this
piece: the **impatient mobile lander** (the piece lives or dies on discovery), the **tablet
lingerer** (tests whether exploration is rewarded), and the **motion-sensitive visitor**
(make-or-break for not making someone feel unwell).

---

## Persona 1 — "the thumb-scroller", impatient mobile lander

**Surface:** the canvas on a phone (≤640px), portrait, one-handed.
**One-line:** Tapped a shared link out of idle curiosity, holds the phone in one hand, thumb
already primed to scroll or swipe-away, and gives the page a few seconds to justify itself. `[web]`

**Job to be done:** Feel a small hit of "oh, *I'm* doing that" — a moment of delight worth the
tap — without reading instructions. `[inferred]`

**Context**
- Phone, one thumb, likely mid-other-activity; very low patience; fast to bounce. Mobile
  hover/drag experiences that don't map to touch drive high bounce; a fast, clear feedback
  loop is what retains. `[web]`
- Arrives with no expectation this is interactive at all — it looks like a moving background. `[inferred]`

**Prior product experience (muscle memory)**
- Instagram/TikTok reflex: a vertical drag means *scroll the page away*, not *interact with
  this surface*. Their first drag may be an exit gesture. `[web + inferred]`
- Has met plenty of "cool" sites that do nothing on touch — so the default assumption is
  "this is just a video." `[web]`

**Expected friction points**
1. **Discovery cliff (the make-or-break).** Drag-to-lead is a non-signified gesture; research
   shows these have a systematic discoverability gap — users don't find swipe/drag without an
   explicit affordance or onboarding hint. If the first-touch cue is too subtle, this persona
   never learns the flock follows them and bounces believing it's a video. `[web]` (GhostUI CHI
   2026; affordance-signifier study)
2. **Gesture collides with scroll reflex.** Their instinct is a vertical thumb-flick to scroll;
   with `touch-action:none` the page won't move and, if feedback isn't instant, that reads as
   "broken/frozen," not "I'm leading the flock." The ring-under-finger must appear on the very
   first pointer-move. `[web + spec]`
3. **Tap-vs-drag mis-fire.** A quick exploratory tap they *meant* as "does anything happen"
   fires a scatter — which could read as delightful *or* as "it flinched away from me,"
   depending on how legible the scatter is as a response. `[inferred]`

**Confidence:** Medium-high. Impatience, bounce behaviour, and the gesture-discoverability gap
are well-documented `[web]`; the exact first-cue threshold that beats the discovery cliff is a
build/verify tuning question.

---

## Persona 2 — "the lingerer", exploratory tablet visitor

**Surface:** the canvas on a tablet (641–1024px), often propped or two-handed, landscape or
portrait.
**One-line:** On a tablet in a low-stakes moment (couch, break), more patient than the phone
lander, and willing to poke at things to see what they do. `[inferred]`

**Job to be done:** Explore — find the edges of what this responds to, and enjoy a calm,
absorbing few minutes. `[inferred]`

**Context**
- Larger surface, two hands available, no urgency; the tablet is a "lean-back exploration"
  device. `[inferred]`
- Higher expectation that touch "just works" — tablets are where touch-native apps and games
  live. `[web]`

**Prior product experience (muscle memory)**
- Tablet games and drawing apps: expects direct manipulation — press *this* thing, *this* thing
  reacts, immediately and locally. `[web]`
- Museum/installation touch pieces: expects to be able to switch modes/scenes and for the
  switch to feel like part of the art. `[inferred]`

**Expected friction points**
1. **Scene-switch reachability.** The two-row header puts modes top-of-screen; on a large
   tablet held at the bottom, the top row is a stretch. Less "bounce," more "mild reach
   friction" — worth checking tap targets and whether top-anchored nav is comfortable one-
   handed on a 10" device. `[spec + inferred]`
2. **Expects locality the sim doesn't give.** Direct-manipulation muscle memory expects the
   *nearest* agents to react to their finger; the boids target is global, so the whole flock
   swings toward the finger. This can read as magical or as "loose/unresponsive" depending on
   arrival-radius tuning. `[inferred]`
3. **Wants more depth than exists.** A lingerer probes for hidden interactions; there are only
   two (lead, scatter) plus scene switch. Risk is a quiet "is that all?" — mitigated if the
   three scenes feel distinct enough to reward switching. `[inferred]`

**Confidence:** Medium. Tablet exploration posture and touch-native expectations are
reasonable `[web + inferred]`; the locality-expectation friction is inferred and is a prime
thing for the walkthrough (2b) to test.

---

## Persona 3 — "the sensitive one", reduced-motion visitor

**Surface:** the canvas on any device with `prefers-reduced-motion: reduce` set.
**One-line:** Has reduced-motion enabled — often for vestibular sensitivity or migraine
triggers — and lands on a full-screen perpetual-motion piece. `[web + inferred]`

**Job to be done:** Experience the piece without physical discomfort; ideally still feel the
interactivity. `[inferred]`

**Context**
- Set reduced-motion deliberately; full-bleed autonomous drifting motion is exactly the
  category that can trigger discomfort. `[web]` (WCAG 2.3.3 Animation from Interactions rationale)
- Not an edge case to bolt on — for this persona it's the whole experience or an exit. `[inferred]`

**Prior product experience (muscle memory)**
- Well-built sites honour the setting (reduced or removed non-essential motion); this persona
  notices instantly when a site ignores it. `[web]`

**Expected friction points**
1. **Autonomous idle-drift is the trigger, not the interaction.** The brief's resolution —
   keep interactivity, cut autonomy (no idle-drift, no veil, reduced pace) — is exactly right
   for this persona; the risk is a build that only quiets CSS animations and leaves the rAF
   loop drifting. This persona validates that the *canvas loop itself* honours the setting. `[web + spec]`
2. **Over-correction to a dead page.** If reduced-motion freezes everything, this persona gets
   a static image and loses the point of visiting. The interactive-but-still resolution must
   still let their touch move the flock. `[inferred]`

**Confidence:** Medium-high on the need (well-documented accessibility requirement) `[web]`;
the preferred depth (interactive-still vs. full-freeze) is the open taste call this persona
exists to pressure-test.

---

## What would upgrade this pack

In priority order:

1. **Real session signal** — even lightweight analytics on a deployed build (do touch users
   discover the drag? where do they leave?) would move persona 1's discovery-cliff from
   `[web]`-analogous to `[client]`-direct. Highest leverage.
2. **App-store / forum reviews of 2–3 specific incumbent interactive-art or ambient-toy apps**
   — real user voice one step from these visitors, to sharpen persona 2's "is that all?" and
   locality-expectation traits beyond inference.
3. **One or two proxy observations** — anyone handed the current desktop build on a phone,
   watched cold. Three cold touch-users would out-evidence all the inference here.
4. **Regional/context grounding** — if there's a target audience (design community vs. general
   share), it would refine the patience and prior-experience assumptions.

_Loudness-bias note: traits grounded in reviews/forums over-represent the furious and the
delighted; the silent median visitor is invisible, so treat frequency claims as directional._
