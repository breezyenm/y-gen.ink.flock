// Imperative canvas engine for Ink Flock — a faithful port of the
// prototype's DCLogic component. Behaviour contract: `MODES` in modes.ts.
// React owns chrome state; the engine reports mode commits via callback.

import {
  DENSITY_MUL,
  MODES,
  PACE_MUL,
  type Density,
  type KoiTone,
  type ModeKey,
  type Pace,
} from "./modes";

interface Pt {
  x: number;
  y: number;
}

interface Agent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  al: number;
  phase: number;
  run: number;
  wob: number;
  orbA: number;
  orbR: number;
  dir: number;
  tone: KoiTone;
  pts: Pt[] | null;
}

interface Ripple {
  x: number;
  y: number;
  t: number;
  dur: number;
  max: number;
}

interface Dust {
  x: number;
  y: number;
  r: number;
  t: number;
  dur: number;
}

interface Veil {
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
}

// Trail-segment widths for the koi body, head to tail.
const KOI_W = [4.6, 5.4, 5.6, 5.2, 4.4, 3.6, 2.9, 2.3, 1.8, 1.3, 0.95, 0.7, 0.5, 0.4];

// Antelope legs: [shoulder x, gait phase offset].
const LEGS: ReadonlyArray<readonly [number, number]> = [
  [6.2, 0],
  [4.2, 2.7],
  [-6.2, 3.7],
  [-8, 1],
];

export class FlockEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: FlockEngineOptions;

  private mode: ModeKey;
  private w = 0;
  private h = 0;
  private agents: Agent[] = [];
  private pointer = { x: 0, y: 0, t: -1e9 };
  private scare: { x: number; y: number; t: number } | null = null;
  private veilAnim: Veil | null = null;
  private ripples: Ripple[] = [];
  private dust: Dust[] = [];
  private decorK: number[][] | null = null;
  private decorS: number[][] | null = null;
  private last = 0;
  private raf = 0;

  private onMove = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.t = performance.now();
  };

  private onDown = (e: PointerEvent) => {
    const n = performance.now();
    this.scare = { x: e.clientX, y: e.clientY, t: n };
    this.ripples.push({ x: e.clientX, y: e.clientY, t: n, dur: 900, max: 90 });
  };

  private onResize = () => this.fit();

  constructor(canvas: HTMLCanvasElement, opts: FlockEngineOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.mode = opts.startMode;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  start() {
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("resize", this.onResize);
    this.fit();
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
    window.removeEventListener("resize", this.onResize);
  }

  /** Begin a veil transition into `m`; ignored mid-fade-in or if already there. */
  requestMode(m: ModeKey) {
    if (m === this.mode || (this.veilAnim && this.veilAnim.phase === "in")) return;
    this.veilAnim = { phase: "in", t0: performance.now(), to: m, color: MODES[m].veil };
  }

  private fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private densityMul() {
    return DENSITY_MUL[this.opts.density] ?? 1;
  }

  private paceMul() {
    return PACE_MUL[this.opts.pace] ?? 1;
  }

  private build() {
    const cfg = MODES[this.mode];
    const n = Math.max(3, Math.round(cfg.count * this.densityMul()));
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
        tone: "washi",
        pts: null,
      };
      if (this.mode === "koi") {
        a.s = 2.1 + R() * 1.1;
        a.tone = i === 0 ? "shu" : i === 1 ? "akari" : i % 4 === 3 ? "jade" : "washi";
        a.pts = [];
        for (let k = 0; k < 14; k++) a.pts.push({ x: a.x - a.vx * k * 3.5, y: a.y - a.vy * k * 3.5 });
      }
      if (this.mode === "safari") {
        const top = h * 0.66 + 24;
        a.y = top + R() * (h - 40 - top);
        a.s = 0.8 + R() * 0.35;
      }
      this.agents.push(a);
    }
  }

  private target(now: number) {
    const active = now - this.pointer.t < 3000;
    if (active) return { x: this.pointer.x, y: this.pointer.y, active: true };
    const t = now;
    return {
      x: this.w * 0.5 + Math.cos(t * 0.00021) * this.w * 0.27,
      y: this.h * 0.5 + Math.sin(t * 0.00043) * this.h * 0.2,
      active: false,
    };
  }

  private step(now: number) {
    const dt = Math.min(50, now - this.last);
    this.last = now;
    const k = Math.max(0.3, Math.min(2.4, dt / 16.7));
    const cfg = MODES[this.mode];
    const pace = this.paceMul();
    const maxS = cfg.maxSpeed * pace;
    const maxF = cfg.maxForce * pace;
    const tgt = this.target(now);
    const band = { top: this.h * 0.66 + 24, bot: this.h - 36 };
    if (this.mode === "safari") tgt.y = Math.max(band.top, Math.min(band.bot, tgt.y));
    const A = this.agents;
    const scare = this.scare && now - this.scare.t < 800 ? this.scare : null;
    const sepR2 = cfg.rSep * cfg.rSep;
    const aliR2 = cfg.rAli * cfg.rAli;
    const cohR2 = cfg.rCoh * cfg.rCoh;

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
          sx += (dx / d) * (1 - d / cfg.rSep);
          sy += (dy / d) * (1 - d / cfg.rSep);
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
      const ox = tgt.x + Math.cos(a.orbA) * cfg.orbit * a.orbR;
      const oy = tgt.y + Math.sin(a.orbA) * cfg.orbit * a.orbR * (this.mode === "safari" ? 0.35 : 1);
      const gx = ox - a.x;
      const gy = oy - a.y;
      const gd = Math.hypot(gx, gy) || 1;
      let want = maxS;
      if (gd < cfg.arrive) want = maxS * (gd / cfg.arrive);
      accX += ((gx / gd) * want - a.vx) * maxF * cfg.wSeek * 0.5;
      accY += ((gy / gd) * want - a.vy) * maxF * cfg.wSeek * 0.5;
      if (scare) {
        const dx = a.x - scare.x;
        const dy = a.y - scare.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / 340) * (1 - (now - scare.t) / 800) * 1.35;
        accX += (dx / d) * f;
        accY += (dy / d) * f;
      }
      a.wob += (Math.random() - 0.5) * 0.4;
      accX += Math.cos(a.wob) * 0.014;
      accY += Math.sin(a.wob) * 0.014;
      const M = 70;
      if (a.x < M) accX += (M - a.x) * 0.004;
      if (a.x > this.w - M) accX -= (a.x - this.w + M) * 0.004;
      if (a.y < M) accY += (M - a.y) * 0.004;
      if (a.y > this.h - M) accY -= (a.y - this.h + M) * 0.004;
      if (this.mode === "safari") {
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
      if (this.mode === "safari") a.y = Math.max(band.top - 30, Math.min(band.bot + 10, a.y));
      a.phase += (5 + sp * 2.4) * 0.016 * k * pace;
      a.run += sp * 0.055 * k;
      if (Math.abs(a.vx) > 0.25) a.dir = a.vx > 0 ? 1 : -1;
      if (a.pts) {
        const hd = a.pts[0];
        hd.x = a.x;
        hd.y = a.y;
        const d = Math.hypot(hd.x - a.pts[1].x, hd.y - a.pts[1].y);
        if (d > 3.5) {
          a.pts.unshift({ x: a.x, y: a.y });
          if (a.pts.length > 14) a.pts.pop();
        }
      }
      if (this.mode === "safari" && sp > 2 && Math.random() < 0.18) {
        this.dust.push({
          x: a.x - a.dir * 10 * a.s,
          y: a.y + 2,
          r: 2 + Math.random() * 3,
          t: now,
          dur: 700 + Math.random() * 500,
        });
      }
    }
    if (this.mode === "koi" && Math.random() < 0.012 && A.length) {
      const a = A[(Math.random() * A.length) | 0];
      this.ripples.push({ x: a.x, y: a.y, t: now, dur: 1600, max: 46 });
    }
    this.draw(now);
  }

  private seeded(n: number, salt: number) {
    const out: number[][] = [];
    let s = 1234 + salt * 999 + Math.round(this.w * 7 + this.h * 13);
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s & 0xffff) / 0xffff;
    };
    for (let i = 0; i < n; i++) out.push([r(), r(), r(), r()]);
    return out;
  }

  private draw(now: number) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.clearRect(0, 0, w, h);
    if (this.mode === "birds") this.sceneBirds(ctx, w, h);
    if (this.mode === "koi") this.sceneKoi(ctx, w, h);
    if (this.mode === "safari") this.sceneSafari(ctx, w, h);
    const A = this.agents;
    if (this.mode === "birds") for (const a of A) this.drawBird(ctx, a);
    if (this.mode === "koi") {
      this.drawRipples(ctx, now);
      for (const a of A) this.drawKoi(ctx, a, now);
    }
    if (this.mode === "safari") {
      this.drawDust(ctx, now);
      const S = A.slice().sort((p, q) => p.y - q.y);
      for (const a of S) this.drawAntelope(ctx, a, h);
    }
    this.drawCursor(ctx, now);
    this.drawVeil(ctx, now, w, h);
  }

  private sceneBirds(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#FBF8F1");
    g.addColorStop(1, "#EFE7D4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sx = w * 0.72, sy = h * 0.3, r = Math.min(w, h) * 0.14;
    const halo = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 2.4);
    halo.addColorStop(0, "rgba(217,58,43,0.16)");
    halo.addColorStop(1, "rgba(217,58,43,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(sx - r * 2.4, sy - r * 2.4, r * 4.8, r * 4.8);
    ctx.fillStyle = "#D93A2B";
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(22,27,26,0.05)";
    ctx.beginPath();
    ctx.moveTo(-20, h);
    ctx.quadraticCurveTo(w * 0.18, h * 0.72, w * 0.42, h + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(22,27,26,0.035)";
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h + 10);
    ctx.quadraticCurveTo(w * 0.55, h * 0.8, w * 0.95, h + 30);
    ctx.closePath();
    ctx.fill();
  }

  private sceneKoi(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#142C2A");
    g.addColorStop(0.55, "#0D1C1B");
    g.addColorStop(1, "#081312");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const mx = w * 0.2, my = h * 0.25, r = Math.min(w, h) * 0.1;
    const halo = ctx.createRadialGradient(mx, my, r * 0.3, mx, my, r * 3);
    halo.addColorStop(0, "rgba(251,248,241,0.07)");
    halo.addColorStop(1, "rgba(251,248,241,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - r * 3, my - r * 3, r * 6, r * 6);
    ctx.fillStyle = "rgba(251,248,241,0.09)";
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(201,224,220,0.05)";
    ctx.lineWidth = 1;
    for (const [a, b, c] of this.decorK ?? (this.decorK = this.seeded(5, 2))) {
      ctx.beginPath();
      ctx.moveTo(a * w - 80, b * h);
      ctx.quadraticCurveTo(a * w, b * h + (c - 0.5) * 30, a * w + 80 + c * 90, b * h);
      ctx.stroke();
    }
  }

  private sceneSafari(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const hz = h * 0.66;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#54300F");
    sky.addColorStop(0.62, "#B5661F");
    sky.addColorStop(1, "#EFB45A");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hz + 1);
    const sx = w * 0.3, r = Math.min(w, h) * 0.16;
    const halo = ctx.createRadialGradient(sx, hz, r * 0.5, sx, hz, r * 2.6);
    halo.addColorStop(0, "rgba(217,58,43,0.35)");
    halo.addColorStop(1, "rgba(217,58,43,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(sx - r * 2.6, hz - r * 2.6, r * 5.2, r * 2.6);
    ctx.fillStyle = "#BC2E20";
    ctx.beginPath();
    ctx.arc(sx, hz, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    const gr = ctx.createLinearGradient(0, hz, 0, h);
    gr.addColorStop(0, "#4A2B10");
    gr.addColorStop(1, "#1D1105");
    ctx.fillStyle = gr;
    ctx.fillRect(0, hz, w, h - hz);
    ctx.save();
    ctx.translate(w * 0.84, hz + 2);
    ctx.scale(1.15, 1.15);
    ctx.strokeStyle = "#1A0F06";
    ctx.fillStyle = "#1A0F06";
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3, -22, -4, -40);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.quadraticCurveTo(-14, -30, -22, -36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-1, -26);
    ctx.quadraticCurveTo(12, -36, 20, -40);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-8, -44, 30, 6.5, -0.06, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -47, 18, 5, 0.05, 0, 7);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(26,15,6,0.5)";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    for (const [a, b, c] of this.decorS ?? (this.decorS = this.seeded(26, 5))) {
      const gy = hz + 8 + b * (h - hz - 20);
      const gs = 0.6 + b;
      ctx.beginPath();
      ctx.moveTo(a * w, gy);
      ctx.quadraticCurveTo(a * w + (c - 0.5) * 6, gy - 5 * gs, a * w + (c - 0.5) * 10, gy - 9 * gs);
      ctx.stroke();
    }
  }

  private drawBird(ctx: CanvasRenderingContext2D, a: Agent) {
    const ang = Math.atan2(a.vy, a.vx);
    const f = Math.sin(a.phase);
    const ff = (f + 1) / 2;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(ang);
    ctx.scale(a.s, a.s);
    const ink = `rgba(12,16,15,${a.al})`;
    ctx.strokeStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const tipX = 1.5 - 6.5 * ff;
    const tipY = 11.5 - 4 * ff;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(1.5, sd * 1.1);
      ctx.quadraticCurveTo(2.6, sd * 5.5, tipX, sd * tipY);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = 5.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0.4, sd * 0.9);
      ctx.quadraticCurveTo(1, sd * 3.6, tipX * 0.5, sd * tipY * 0.6);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-5.5, 0);
    ctx.quadraticCurveTo(0, -1.3, 5.8, 0);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3.4, 0);
    ctx.lineTo(7.4, 0);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-9.6, 2.1);
    ctx.moveTo(-5, 0);
    ctx.lineTo(-9.6, -2.1);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  private koiColor(tone: KoiTone, al: number) {
    if (tone === "shu") return `rgba(226,85,66,${al})`;
    if (tone === "akari") return `rgba(239,180,90,${al})`;
    if (tone === "jade") return `rgba(161,200,195,${al})`;
    return `rgba(251,248,241,${al})`;
  }

  private drawKoi(ctx: CanvasRenderingContext2D, a: Agent, now: number) {
    const pts = a.pts;
    if (!pts || pts.length < 3) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const n = pts.length;
    const off: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.min(i + 1, n - 1)];
      const p1 = pts[Math.max(i - 1, 0)];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const m = Math.hypot(dx, dy) || 1;
      const sway = Math.sin(now * 0.0048 + a.phase * 2 + i * 0.72) * (0.8 + 5.2 * (i / n));
      off.push({ x: pts[i].x + (-dy / m) * sway, y: pts[i].y + (dx / m) * sway });
    }
    ctx.strokeStyle = this.koiColor(a.tone, 0.1);
    for (let i = n - 1; i > 0; i--) {
      ctx.lineWidth = (KOI_W[i] + 2.6) * a.s * 0.62;
      ctx.beginPath();
      ctx.moveTo(off[i].x, off[i].y);
      ctx.lineTo(off[i - 1].x, off[i - 1].y);
      ctx.stroke();
    }
    ctx.strokeStyle = this.koiColor(a.tone, a.tone === "washi" ? 0.88 : 0.92);
    for (let i = n - 1; i > 0; i--) {
      ctx.lineWidth = KOI_W[i] * a.s * 0.62;
      ctx.beginPath();
      ctx.moveTo(off[i].x, off[i].y);
      ctx.lineTo(off[i - 1].x, off[i - 1].y);
      ctx.stroke();
    }
    const hd = off[0];
    const nk = off[2];
    let hx = hd.x - nk.x;
    let hy = hd.y - nk.y;
    const hm = Math.hypot(hx, hy) || 1;
    hx /= hm;
    hy /= hm;
    ctx.fillStyle = this.koiColor(a.tone, a.tone === "washi" ? 0.9 : 0.94);
    ctx.beginPath();
    ctx.ellipse(
      hd.x + hx * 1.2 * a.s * 0.62,
      hd.y + hy * 1.2 * a.s * 0.62,
      3.1 * a.s * 0.62,
      2.35 * a.s * 0.62,
      Math.atan2(hy, hx),
      0,
      7,
    );
    ctx.fill();
    const fw = Math.sin(now * 0.005 + a.phase) * 0.35;
    ctx.strokeStyle = this.koiColor(a.tone, 0.55);
    ctx.lineWidth = 1.6 * a.s * 0.62;
    for (const sd of [-1, 1]) {
      const px = -hy * sd;
      const py = hx * sd;
      ctx.beginPath();
      ctx.moveTo(nk.x + px * 2.4 * a.s * 0.62, nk.y + py * 2.4 * a.s * 0.62);
      ctx.quadraticCurveTo(
        nk.x + (px * 6 - hx * 3) * a.s * 0.62,
        nk.y + (py * 6 - hy * 3) * a.s * 0.62,
        nk.x + (px * (7.5 + fw * 3) - hx * 6.5) * a.s * 0.62,
        nk.y + (py * (7.5 + fw * 3) - hy * 6.5) * a.s * 0.62,
      );
      ctx.stroke();
    }
    const tl = off[n - 1];
    const t2 = off[n - 3];
    let tx = tl.x - t2.x;
    let ty = tl.y - t2.y;
    const tm = Math.hypot(tx, ty) || 1;
    tx /= tm;
    ty /= tm;
    ctx.strokeStyle = this.koiColor(a.tone, 0.5);
    ctx.lineWidth = 1.3 * a.s * 0.62;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(tl.x, tl.y);
      ctx.quadraticCurveTo(
        tl.x + tx * 6 * a.s * 0.62,
        tl.y + ty * 6 * a.s * 0.62,
        tl.x + (tx * 10 - ty * sd * 4.5) * a.s * 0.62,
        tl.y + (ty * 10 + tx * sd * 4.5) * a.s * 0.62,
      );
      ctx.stroke();
    }
  }

  private drawAntelope(ctx: CanvasRenderingContext2D, a: Agent, h: number) {
    const band = { top: h * 0.66 + 24, bot: h - 36 };
    const per = 0.5 + 0.7 * Math.max(0, Math.min(1, (a.y - band.top) / (band.bot - band.top)));
    const s = a.s * per;
    const sp = Math.hypot(a.vx, a.vy);
    const gait = Math.min(1, sp / 2.4 + 0.15);
    const bounce = -Math.abs(Math.sin(a.run)) * 2.6 * s * gait;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.fillStyle = "rgba(16,9,3,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 1.5 * s, 13 * s, 2.6 * s, 0, 0, 7);
    ctx.fill();
    ctx.scale(s * a.dir, s);
    ctx.translate(0, bounce / s);
    const ink = "#170E05";
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = "round";
    ctx.lineWidth = 1.6;
    for (const [lx, ph] of LEGS) {
      const sw = Math.sin(a.run + ph) * 0.85 * gait;
      const kx = lx + sw * 3.6;
      const ky = -1.5;
      const fx = lx + sw * 7.2;
      const fy = 4.6 - Math.max(0, sw) * 2.4 * gait;
      ctx.beginPath();
      ctx.moveTo(lx, -5.5);
      ctx.quadraticCurveTo(kx, ky, fx, fy);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-9.5, -6.2);
    ctx.quadraticCurveTo(-3, -9.4, 5.5, -8.6);
    ctx.quadraticCurveTo(9.5, -8.2, 11.6, -13.8);
    ctx.lineTo(15.2, -13);
    ctx.quadraticCurveTo(13.5, -10.8, 12, -10.2);
    ctx.quadraticCurveTo(10, -6.2, 7.5, -5);
    ctx.quadraticCurveTo(0, -3.6, -6.5, -4.6);
    ctx.quadraticCurveTo(-9.8, -5, -9.5, -6.2);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(12, -14.6);
    ctx.quadraticCurveTo(9.6, -19.5, 11, -23);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13.4, -14.4);
    ctx.quadraticCurveTo(12.4, -19.8, 14.4, -22.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, -13.6);
    ctx.lineTo(8.8, -15.2);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-9.6, -6);
    ctx.quadraticCurveTo(-11.4, -4, -11.2, -1.6);
    ctx.stroke();
    ctx.restore();
  }

  private drawRipples(ctx: CanvasRenderingContext2D, now: number) {
    this.ripples = this.ripples.filter((r) => now - r.t < r.dur);
    for (const r of this.ripples) {
      const p = (now - r.t) / r.dur;
      ctx.strokeStyle = `rgba(201,224,220,${0.28 * (1 - p)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.max * p + 4, (r.max * p + 4) * 0.62, 0, 0, 7);
      ctx.stroke();
      if (p > 0.25) {
        ctx.strokeStyle = `rgba(201,224,220,${0.16 * (1 - p)})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.max * (p - 0.25) + 3, (r.max * (p - 0.25) + 3) * 0.62, 0, 0, 7);
        ctx.stroke();
      }
    }
  }

  private drawDust(ctx: CanvasRenderingContext2D, now: number) {
    this.dust = this.dust.filter((d) => now - d.t < d.dur);
    for (const d of this.dust) {
      const p = (now - d.t) / d.dur;
      ctx.fillStyle = `rgba(239,180,90,${0.13 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y - p * 6, d.r + p * 7, 0, 7);
      ctx.fill();
    }
  }

  private drawCursor(ctx: CanvasRenderingContext2D, now: number) {
    if (now - this.pointer.t > 3000) return;
    const { x, y } = this.pointer;
    const cfg = MODES[this.mode];
    ctx.strokeStyle = cfg.ink;
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
        this.mode = v.to;
        this.build();
        this.dust = [];
        this.ripples = [];
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
}
