// Scene-agnostic boids core: neighbour forces, orbit-seek, scare, wobble,
// edge margins, speed clamps, the pointer/idle-drift target, the veil
// transition, the cursor ring, and the rAF/input lifecycle. Everything a
// scene looks or behaves like sits behind the Scene seam (lib/flock/scenes).
// Behaviour contract: the Ink Flock prototype, constants in each scene's cfg.

import { DENSITY_MUL, PACE_MUL, SCENES } from "./modes";
import { classifyGesture, scaledCount, viewportScale } from "./responsive";
import { bandOf, type Agent, type Density, type ModeKey, type Pace, type Scene } from "./types";

interface VeilAnim {
  phase: "in" | "out";
  t0: number;
  to: ModeKey;
  color: string;
}

export interface FlockEngineOptions {
  startMode: ModeKey;
  density: Density;
  pace: Pace;
  onModeCommitted: (mode: ModeKey) => void;
  /** Fired once, on the first touch/pen interaction — dismisses the touch hint. */
  onFirstInteract?: () => void;
}

export class FlockEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: FlockEngineOptions;

  private scene: Scene;
  private w = 0;
  private h = 0;
  /** Viewport spatial scale (1 on desktop/tablet, <1 on phones). */
  private scale = 1;
  /** Honour prefers-reduced-motion: no autonomous drift, no veil sweep. */
  private reduced = false;
  private agents: Agent[] = [];
  private pointer = { x: 0, y: 0, t: -1e9 };
  private scare: { x: number; y: number; t: number } | null = null;
  private veilAnim: VeilAnim | null = null;
  private last = 0;
  private raf = 0;
  /** Active touch/pen press being classified as tap-vs-drag on release. */
  private press: { x: number; y: number; t: number; moved: number } | null = null;
  private interacted = false;
  private motionQuery: MediaQueryList | null = null;

  private onMove = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.t = performance.now();
    if (this.press) {
      this.press.moved = Math.max(
        this.press.moved,
        Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y),
      );
    }
  };

  private onDown = (e: PointerEvent) => {
    const n = performance.now();
    // Feed the target immediately so a lead can begin under the finger, and
    // show the cursor ring at the touch point.
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.t = n;
    if (e.pointerType === "mouse") {
      // Desktop unchanged: mouse-down scatters (a click), hover leads.
      this.scatterAt(e.clientX, e.clientY, n);
    } else {
      // Touch/pen: defer the scatter decision to release (tap vs. lead-drag).
      this.press = { x: e.clientX, y: e.clientY, t: n, moved: 0 };
      if (!this.interacted) {
        this.interacted = true;
        this.opts.onFirstInteract?.();
      }
    }
  };

  private onUp = (e: PointerEvent) => {
    const p = this.press;
    this.press = null;
    if (!p || e.pointerType === "mouse") return;
    const n = performance.now();
    if (classifyGesture(p.moved, n - p.t) === "tap") this.scatterAt(e.clientX, e.clientY, n);
  };

  private onResize = () => this.fit();

  private onMotionPref = () => {
    this.reduced = this.motionQuery?.matches ?? false;
  };

  constructor(canvas: HTMLCanvasElement, opts: FlockEngineOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.scene = SCENES[opts.startMode];
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  start() {
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
    window.visualViewport?.addEventListener("resize", this.onResize);
    if (typeof window.matchMedia === "function") {
      this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reduced = this.motionQuery.matches;
      this.motionQuery.addEventListener("change", this.onMotionPref);
    }
    this.fit();
    this.scene.reset?.();
    this.build();
    this.last = performance.now();
    const loop = (t: number) => {
      this.step(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
    this.motionQuery?.removeEventListener("change", this.onMotionPref);
  }

  /** Queue a scatter at (x,y) and fire the scene's pointer-down effect. */
  private scatterAt(x: number, y: number, now: number) {
    this.scare = { x, y, t: now };
    this.scene.onPointerDown?.(x, y, now);
  }

  /** Begin a veil transition into `m`; ignored mid-fade-in or if already there. */
  requestMode(m: ModeKey) {
    if (m === this.scene.key || (this.veilAnim && this.veilAnim.phase === "in")) return;
    if (this.reduced) {
      // No veil sweep under reduced-motion: hard-cut to the new scene.
      this.scene = SCENES[m];
      this.scene.reset?.();
      this.build();
      this.opts.onModeCommitted(m);
      return;
    }
    this.veilAnim = { phase: "in", t0: performance.now(), to: m, color: SCENES[m].cfg.veil };
  }

  private fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = viewportScale(this.w, this.h);
    // On resize/rotate, keep the existing flock — clamp it into the new bounds
    // rather than rebuilding (a rebuild would visibly destroy the flock).
    for (const a of this.agents) {
      a.x = Math.max(0, Math.min(this.w, a.x));
      a.y = Math.max(0, Math.min(this.h, a.y));
    }
  }

  private build() {
    const cfg = this.scene.cfg;
    const base = cfg.count * (DENSITY_MUL[this.opts.density] ?? 1);
    // Fewer agents on small viewports so the same count doesn't read as frantic.
    const n = scaledCount(base, this.w, this.h);
    const w = this.w;
    const h = this.h;
    const R = Math.random;
    this.agents = [];
    for (let i = 0; i < n; i++) {
      const a: Agent = {
        x: R() * w,
        y: R() * h,
        vx: (R() - 0.5) * 2,
        vy: (R() - 0.5) * 2,
        s: 0.72 + R() * 0.6,
        al: 0.62 + R() * 0.33,
        phase: R() * 7,
        run: R() * 7,
        wob: R() * 7,
        orbA: R() * 6.28,
        orbR: 0.35 + R() * 0.65,
        dir: 1,
      };
      this.scene.initAgent(a, i, w, h);
      this.agents.push(a);
    }
  }

  private target(now: number) {
    const active = now - this.pointer.t < 3000;
    if (active) return { x: this.pointer.x, y: this.pointer.y };
    const t = now;
    return {
      x: this.w * 0.5 + Math.cos(t * 0.00021) * this.w * 0.27,
      y: this.h * 0.5 + Math.sin(t * 0.00043) * this.h * 0.2,
    };
  }

  private step(now: number) {
    const dt = Math.min(50, now - this.last);
    this.last = now;
    const k = Math.max(0.3, Math.min(2.4, dt / 16.7));
    const cfg = this.scene.cfg;
    const active = now - this.pointer.t < 3000;
    if (this.reduced && !active) {
      // Reduced-motion: no autonomous drift — the flock holds still until touched.
      this.draw(now);
      return;
    }
    const pace = PACE_MUL[this.opts.pace] ?? 1;
    const maxS = cfg.maxSpeed * pace;
    const maxF = cfg.maxForce * pace;
    const tgt = this.target(now);
    const band = cfg.band ? bandOf(cfg.band, this.h) : null;
    if (band) tgt.y = Math.max(band.top, Math.min(band.bot, tgt.y));
    const A = this.agents;
    const scare = this.scare && now - this.scare.t < 800 ? this.scare : null;
    // Spatial constants scale with the viewport so the composition holds on a
    // phone (s === 1 on desktop/tablet — geometry there is untouched).
    const s = this.scale;
    const sepR = cfg.rSep * s;
    const orbit = cfg.orbit * s;
    const arrive = cfg.arrive * s;
    const sepR2 = sepR * sepR;
    const aliR2 = (cfg.rAli * s) * (cfg.rAli * s);
    const cohR2 = (cfg.rCoh * s) * (cfg.rCoh * s);
    const orbitY = cfg.orbitYScale ?? 1;

    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      let sx = 0, sy = 0, axv = 0, ayv = 0, cx = 0, cy = 0, na = 0, nc = 0, accX = 0, accY = 0;
      for (let j = 0; j < A.length; j++) {
        if (j === i) continue;
        const b = A[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < cohR2) { cx += b.x; cy += b.y; nc++; }
        if (d2 < aliR2) { axv += b.vx; ayv += b.vy; na++; }
        if (d2 < sepR2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          sx += (dx / d) * (1 - d / sepR);
          sy += (dy / d) * (1 - d / sepR);
        }
      }
      if (sx || sy) {
        const m = Math.hypot(sx, sy);
        accX += (sx / m) * maxF * cfg.wSep;
        accY += (sy / m) * maxF * cfg.wSep;
      }
      if (na) {
        const m = Math.hypot(axv, ayv) || 1;
        accX += ((axv / m) * maxS - a.vx) * 0.05 * cfg.wAli;
        accY += ((ayv / m) * maxS - a.vy) * 0.05 * cfg.wAli;
      }
      if (nc) {
        const gx = cx / nc - a.x;
        const gy = cy / nc - a.y;
        const m = Math.hypot(gx, gy) || 1;
        accX += (gx / m) * maxF * cfg.wCoh;
        accY += (gy / m) * maxF * cfg.wCoh;
      }
      a.orbA += 0.004 * k * (i % 2 ? 1 : -1);
      const ox = tgt.x + Math.cos(a.orbA) * orbit * a.orbR;
      const oy = tgt.y + Math.sin(a.orbA) * orbit * a.orbR * orbitY;
      const gx = ox - a.x;
      const gy = oy - a.y;
      const gd = Math.hypot(gx, gy) || 1;
      let want = maxS;
      if (gd < arrive) want = maxS * (gd / arrive);
      accX += ((gx / gd) * want - a.vx) * maxF * cfg.wSeek * 0.5;
      accY += ((gy / gd) * want - a.vy) * maxF * cfg.wSeek * 0.5;
      if (scare) {
        const dx = a.x - scare.x;
        const dy = a.y - scare.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / (340 * s)) * (1 - (now - scare.t) / 800) * 1.35;
        accX += (dx / d) * f;
        accY += (dy / d) * f;
      }
      a.wob += (Math.random() - 0.5) * 0.4;
      accX += Math.cos(a.wob) * 0.014;
      accY += Math.sin(a.wob) * 0.014;
      const M = 70 * s;
      if (a.x < M) accX += (M - a.x) * 0.004;
      if (a.x > this.w - M) accX -= (a.x - this.w + M) * 0.004;
      if (a.y < M) accY += (M - a.y) * 0.004;
      if (a.y > this.h - M) accY -= (a.y - this.h + M) * 0.004;
      if (band) {
        if (a.y < band.top) accY += (band.top - a.y) * 0.02;
        if (a.y > band.bot) accY -= (a.y - band.bot) * 0.02;
      }
      a.vx += accX * k;
      a.vy += accY * k;
      let sp = Math.hypot(a.vx, a.vy);
      const boost = scare ? 1.5 : 1;
      if (sp > maxS * boost) {
        a.vx *= (maxS * boost) / sp;
        a.vy *= (maxS * boost) / sp;
        sp = maxS * boost;
      }
      if (sp < cfg.minSpeed && sp > 0.001) {
        a.vx *= cfg.minSpeed / sp;
        a.vy *= cfg.minSpeed / sp;
        sp = cfg.minSpeed;
      }
      a.x += a.vx * k;
      a.y += a.vy * k;
      if (band) a.y = Math.max(band.top - 30, Math.min(band.bot + 10, a.y));
      a.phase += (5 + sp * 2.4) * 0.016 * k * pace;
      a.run += sp * 0.055 * k;
      if (Math.abs(a.vx) > 0.25) a.dir = a.vx > 0 ? 1 : -1;
      this.scene.afterAgentStep?.(a, sp, now);
    }
    this.scene.afterFrame?.(A, now);
    this.draw(now);
  }

  private seeded = (n: number, salt: number) => {
    const out: number[][] = [];
    let s = 1234 + salt * 999 + Math.round(this.w * 7 + this.h * 13);
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s & 0xffff) / 0xffff;
    };
    for (let i = 0; i < n; i++) out.push([r(), r(), r(), r()]);
    return out;
  };

  private draw(now: number) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.clearRect(0, 0, w, h);
    this.scene.drawBackground(ctx, w, h, this.seeded);
    this.scene.drawAgents(ctx, this.agents, now, w, h);
    this.drawCursor(ctx, now);
    this.drawVeil(ctx, now, w, h);
  }

  private drawCursor(ctx: CanvasRenderingContext2D, now: number) {
    if (now - this.pointer.t > 3000) return;
    const { x, y } = this.pointer;
    ctx.strokeStyle = this.scene.cfg.ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 13 + Math.sin(now * 0.003) * 1.5, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#D93A2B";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 7);
    ctx.fill();
  }

  private drawVeil(ctx: CanvasRenderingContext2D, now: number, w: number, h: number) {
    const v = this.veilAnim;
    if (!v) return;
    const el = now - v.t0;
    if (v.phase === "in") {
      const p = Math.min(1, el / 260);
      ctx.globalAlpha = p;
      if (p >= 1) {
        this.scene = SCENES[v.to];
        this.scene.reset?.();
        this.build();
        this.opts.onModeCommitted(v.to);
        v.phase = "out";
        v.t0 = now;
      }
    } else {
      const p = Math.min(1, el / 420);
      ctx.globalAlpha = 1 - p;
      if (p >= 1) {
        this.veilAnim = null;
        ctx.globalAlpha = 0;
      }
    }
    ctx.fillStyle = v.color;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  // ---- Capture support (dev only) --------------------------------------
  // Drive the simulation deterministically, one frame at a time, bypassing
  // requestAnimationFrame and the veil transition. A headless recorder calls
  // these in a plain loop so frame timing never depends on the browser's
  // (throttled, hidden-tab) frame clock. No effect on the normal rAF path.

  /** Prepare for capture: size the canvas and build the opening scene. */
  captureInit(mode: ModeKey) {
    this.fit();
    this.scene = SCENES[mode];
    this.scene.reset?.();
    this.build();
    this.last = 0;
  }

  /** Hard-cut to a scene (no veil), rebuilding its agents. */
  captureSetScene(mode: ModeKey) {
    this.scene = SCENES[mode];
    this.scene.reset?.();
    this.build();
  }

  /** Queue a scatter at (x,y) as of synthetic time `now`. */
  captureClick(x: number, y: number, now: number) {
    this.scare = { x, y, t: now };
    this.scene.onPointerDown?.(x, y, now);
  }

  /** Advance and paint one frame: pointer at (px,py), fixed 30fps timestep. */
  captureFrame(now: number, px: number, py: number) {
    this.pointer.x = px;
    this.pointer.y = py;
    this.pointer.t = now;
    this.last = now - 1000 / 30;
    this.step(now);
  }
}
