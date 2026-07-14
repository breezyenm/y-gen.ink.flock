// Koi 鯉 — deep nando pond, moon halo, four koi tones with swaying trails.
// The scene owns the ripple buffer: ambient ripples and the click ripple
// spawn here, so other scenes never accumulate entries (fixes a prototype
// leak where clicks in Birds/Safari pushed ripples nothing ever pruned).

import type { Agent, KoiTone, Pt, Scene, SceneConfig, SeededFn } from "../types";

const cfg: SceneConfig = {
  kanji: "鯉",
  label: "Koi",
  ja: "「錦鯉」",
  en: "Beneath the surface, patience",
  ink: "#FBF8F1",
  veil: "#081312",
  faint: "rgba(251,248,241,0.48)",
  count: 13,
  maxSpeed: 2.15,
  maxForce: 0.105,
  minSpeed: 0.45,
  rSep: 42,
  rAli: 46,
  rCoh: 70,
  wSep: 1.5,
  wAli: 0.7,
  wCoh: 0.5,
  wSeek: 0.6,
  arrive: 170,
  orbit: 90,
};

interface Ripple {
  x: number;
  y: number;
  t: number;
  dur: number;
  max: number;
}

// Trail-segment widths for the koi body, head to tail.
const KOI_W = [4.6, 5.4, 5.6, 5.2, 4.4, 3.6, 2.9, 2.3, 1.8, 1.3, 0.95, 0.7, 0.5, 0.4];

function koiColor(tone: KoiTone | undefined, al: number) {
  if (tone === "shu") return `rgba(226,85,66,${al})`;
  if (tone === "akari") return `rgba(239,180,90,${al})`;
  if (tone === "jade") return `rgba(161,200,195,${al})`;
  return `rgba(251,248,241,${al})`;
}

function drawKoi(ctx: CanvasRenderingContext2D, a: Agent, now: number) {
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
  ctx.strokeStyle = koiColor(a.tone, 0.1);
  for (let i = n - 1; i > 0; i--) {
    ctx.lineWidth = (KOI_W[i] + 2.6) * a.s * 0.62;
    ctx.beginPath();
    ctx.moveTo(off[i].x, off[i].y);
    ctx.lineTo(off[i - 1].x, off[i - 1].y);
    ctx.stroke();
  }
  ctx.strokeStyle = koiColor(a.tone, a.tone === "washi" ? 0.88 : 0.92);
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
  ctx.fillStyle = koiColor(a.tone, a.tone === "washi" ? 0.9 : 0.94);
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
  ctx.strokeStyle = koiColor(a.tone, 0.55);
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
  ctx.strokeStyle = koiColor(a.tone, 0.5);
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

class KoiScene implements Scene {
  readonly key = "koi" as const;
  readonly cfg = cfg;

  private ripples: Ripple[] = [];
  private decor: number[][] | null = null;

  reset() {
    this.ripples = [];
  }

  initAgent(a: Agent, i: number) {
    a.s = 2.1 + Math.random() * 1.1;
    a.tone = i === 0 ? "shu" : i === 1 ? "akari" : i % 4 === 3 ? "jade" : "washi";
    a.pts = [];
    for (let k = 0; k < 14; k++) a.pts.push({ x: a.x - a.vx * k * 3.5, y: a.y - a.vy * k * 3.5 });
  }

  afterAgentStep(a: Agent) {
    const pts = a.pts;
    if (!pts) return;
    const hd = pts[0];
    hd.x = a.x;
    hd.y = a.y;
    const d = Math.hypot(hd.x - pts[1].x, hd.y - pts[1].y);
    if (d > 3.5) {
      pts.unshift({ x: a.x, y: a.y });
      if (pts.length > 14) pts.pop();
    }
  }

  afterFrame(agents: Agent[], now: number) {
    if (Math.random() < 0.012 && agents.length) {
      const a = agents[(Math.random() * agents.length) | 0];
      this.ripples.push({ x: a.x, y: a.y, t: now, dur: 1600, max: 46 });
    }
  }

  onPointerDown(x: number, y: number, now: number) {
    this.ripples.push({ x, y, t: now, dur: 900, max: 90 });
  }

  drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, seeded: SeededFn) {
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
    for (const [a, b, c] of this.decor ?? (this.decor = seeded(5, 2))) {
      ctx.beginPath();
      ctx.moveTo(a * w - 80, b * h);
      ctx.quadraticCurveTo(a * w, b * h + (c - 0.5) * 30, a * w + 80 + c * 90, b * h);
      ctx.stroke();
    }
  }

  drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[], now: number) {
    this.drawRipples(ctx, now);
    for (const a of agents) drawKoi(ctx, a, now);
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
}

export const koiScene = new KoiScene();
