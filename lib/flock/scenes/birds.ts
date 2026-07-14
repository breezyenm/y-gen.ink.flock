// Birds 鳥 — washi-cream sky, vermilion sun, line-drawn migrating flock.
// Everything this scene is — constants, setup, painting — lives here.

import type { Agent, Scene, SceneConfig, SeededFn } from "../types";

const cfg: SceneConfig = {
  kanji: "鳥",
  label: "Birds",
  ja: "「渡り鳥」",
  en: "The sky remembers the way",
  ink: "#161B1A",
  veil: "#F5EFE2",
  faint: "rgba(22,27,26,0.45)",
  count: 46,
  maxSpeed: 4.4,
  maxForce: 0.14,
  minSpeed: 1.5,
  rSep: 26,
  rAli: 60,
  rCoh: 90,
  wSep: 1.7,
  wAli: 0.9,
  wCoh: 0.65,
  wSeek: 0.95,
  arrive: 130,
  orbit: 70,
};

function drawBird(ctx: CanvasRenderingContext2D, a: Agent) {
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

class BirdsScene implements Scene {
  readonly key = "birds" as const;
  readonly cfg = cfg;

  initAgent() {
    // Base agent is already bird-shaped; nothing to adjust.
  }

  drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, _seeded: SeededFn) {
    void _seeded;
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

  drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[]) {
    for (const a of agents) drawBird(ctx, a);
  }
}

export const birdsScene = new BirdsScene();
