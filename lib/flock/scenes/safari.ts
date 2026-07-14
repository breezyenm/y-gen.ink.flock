// Safari 群 — dusk gradient, setting sun, acacia, antelope herd held to a
// ground band with perspective scaling, dust puffs, and y-sorted painting.

import { bandOf, type Agent, type Scene, type SceneConfig, type SeededFn } from "../types";

const cfg: SceneConfig = {
  kanji: "群",
  label: "Safari",
  ja: "「大移動」",
  en: "The plain moves as one",
  ink: "#FDF4E6",
  veil: "#241407",
  faint: "rgba(253,244,230,0.5)",
  count: 24,
  maxSpeed: 3.3,
  maxForce: 0.11,
  minSpeed: 0.2,
  rSep: 30,
  rAli: 55,
  rCoh: 85,
  wSep: 1.8,
  wAli: 0.85,
  wCoh: 0.6,
  wSeek: 0.9,
  arrive: 110,
  orbit: 55,
  orbitYScale: 0.35,
  band: { topFrac: 0.66, topPad: 24, botPad: 36 },
};

interface Dust {
  x: number;
  y: number;
  r: number;
  t: number;
  dur: number;
}

// Antelope legs: [shoulder x, gait phase offset].
const LEGS: ReadonlyArray<readonly [number, number]> = [
  [6.2, 0],
  [4.2, 2.7],
  [-6.2, 3.7],
  [-8, 1],
];

function drawAntelope(ctx: CanvasRenderingContext2D, a: Agent, h: number) {
  const band = bandOf(cfg.band!, h);
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

class SafariScene implements Scene {
  readonly key = "safari" as const;
  readonly cfg = cfg;

  private dust: Dust[] = [];
  private decor: number[][] | null = null;

  reset() {
    this.dust = [];
  }

  initAgent(a: Agent, _i: number, _w: number, h: number) {
    void _i;
    void _w;
    const { top } = bandOf(cfg.band!, h);
    a.y = top + Math.random() * (h - 40 - top);
    a.s = 0.8 + Math.random() * 0.35;
  }

  afterAgentStep(a: Agent, sp: number, now: number) {
    if (sp > 2 && Math.random() < 0.18) {
      this.dust.push({
        x: a.x - a.dir * 10 * a.s,
        y: a.y + 2,
        r: 2 + Math.random() * 3,
        t: now,
        dur: 700 + Math.random() * 500,
      });
    }
  }

  drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, seeded: SeededFn) {
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
    for (const [a, b, c] of this.decor ?? (this.decor = seeded(26, 5))) {
      const gy = hz + 8 + b * (h - hz - 20);
      const gs = 0.6 + b;
      ctx.beginPath();
      ctx.moveTo(a * w, gy);
      ctx.quadraticCurveTo(a * w + (c - 0.5) * 6, gy - 5 * gs, a * w + (c - 0.5) * 10, gy - 9 * gs);
      ctx.stroke();
    }
  }

  drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[], now: number, _w: number, h: number) {
    void _w;
    this.drawDust(ctx, now);
    const sorted = agents.slice().sort((p, q) => p.y - q.y);
    for (const a of sorted) drawAntelope(ctx, a, h);
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
}

export const safariScene = new SafariScene();
