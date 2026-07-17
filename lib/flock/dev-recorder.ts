// Dev-only capture harness. Records the LIVE canvas (the real engine, real
// pixels) to a video file while a scripted cursor tour drives the flock across
// every scene. Not shipped: wired in only when NODE_ENV !== "production", adds
// no route and no production code. Option 1 from the portfolio-media report —
// real-time captureStream, no re-render, no external dependency.

import { FlockEngine } from "./engine";
import { MODE_KEYS, SCENES, type ModeKey } from "./modes";
import type { SceneConfig } from "./types";

export interface RecordResult {
  mime: string;
  ext: string;
  bytes: number;
  base64: string;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Dispatch a synthetic pointer event on window — the engine listens there. */
function pointer(type: "pointermove" | "pointerdown" | "pointerup", x: number, y: number) {
  window.dispatchEvent(
    new PointerEvent(type, { clientX: x, clientY: y, pointerType: "mouse", bubbles: true }),
  );
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Glide the cursor from a→b over `dur`ms, emitting pointermove each frame. */
function glide(ax: number, ay: number, bx: number, by: number, dur: number) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeInOut(p);
      pointer("pointermove", ax + (bx - ax) * e, ay + (by - ay) * e);
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

async function scatter(x: number, y: number) {
  pointer("pointermove", x, y);
  pointer("pointerdown", x, y);
  pointer("pointerup", x, y);
}

/** Trace a slow circle around (cx,cy) so the flock winds up and gathers. */
function orbit(cx: number, cy: number, r: number, turns: number, dur: number, yScale = 1) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const a0 = -Math.PI / 2;
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const a = a0 + easeInOut(p) * turns * Math.PI * 2;
      pointer("pointermove", cx + Math.cos(a) * r, cy + Math.sin(a) * r * yScale);
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

/**
 * Lead the flock through one scene: glide in toward centre, wind two slow
 * loops so even the patient koi gather and follow, hold, then scatter. Tuned
 * to dwell near centre — a roving perimeter path leaves slow agents behind.
 */
async function tourScene(w: number, h: number) {
  const cx = w * 0.5;
  const cy = h * 0.52;
  const r = Math.min(w, h) * 0.16;
  await glide(w * 0.32, h * 0.5, cx, cy, 1300);
  await orbit(cx, cy, r, 2, 4200, 0.82); // wind up: flock forms and trails the cursor
  await glide(cx, cy, cx + r, cy, 500);
  await wait(300);
  await scatter(cx + r, cy); // burst from a point the flock has clustered on
  await wait(1700);
}

/** Base64-encode a byte buffer in chunks (avoids call-stack blowups). */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function pickMime(): { mime: string; ext: string } {
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: "video/mp4;codecs=avc1", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "video/webm", ext: "webm" };
}

/**
 * Record a full showreel: opening scene → each remaining scene, leading and
 * scattering the flock in each. Resolves with the encoded bytes as base64 so a
 * headless driver can pull them out and write the file.
 */
export async function recordShowreel(
  canvas: HTMLCanvasElement,
  oldEngine: FlockEngine,
  startMode: ModeKey,
): Promise<RecordResult> {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Replace the page's sparse/drifting engine with a capture-tuned one: more
  // agents and a natural pace read far better on video. The canvas is the only
  // thing captured, so the chrome/caption sync we bypass here doesn't matter.
  oldEngine.destroy();
  const engine = new FlockEngine(canvas, {
    startMode,
    density: "natural",
    pace: "natural",
    onModeCommitted: () => {},
  });
  engine.start();

  const { mime, ext } = pickMime();
  const stream = canvas.captureStream(60);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));

  recorder.start();

  // Let the opening scene settle, then walk each scene in registry order.
  await wait(1200);
  await tourScene(w, h);
  const rest = MODE_KEYS.filter((k) => k !== startMode);
  for (const key of rest) {
    engine.requestMode(key);
    await wait(1000); // veil in+out + settle
    await tourScene(w, h);
  }
  await wait(500);

  recorder.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  engine.destroy();

  const blob = new Blob(chunks, { type: mime });
  const base64 = toBase64(await blob.arrayBuffer());
  return { mime, ext, bytes: blob.size, base64 };
}

// ---- Deterministic frame-stepped capture --------------------------------
// The MCP/headless browser renders the tab hidden, so requestAnimationFrame is
// paused and real-time captureStream freezes. Instead we drive the sim by hand,
// render each frame to a JPEG, and POST batches to a local sink; ffmpeg then
// assembles a clean, constant-30fps MP4. Timing is fully under our control.

const CAP = { fps: 30, framesPerScene: 210, outW: 1920, outH: 1080 };

/** Scripted cursor per frame, in CSS px (the sim's coordinate space). */
function scriptedPointer(f: number, W: number, H: number) {
  const scene = Math.floor(f / CAP.framesPerScene);
  const lf = f % CAP.framesPerScene;
  const cx = W * 0.5;
  const cy = H * 0.52;
  const r = Math.min(W, H) * 0.16;
  let x: number;
  let y: number;
  if (lf < 40) {
    const e = easeInOut(lf / 40); // glide in toward centre
    x = W * 0.3 + (cx - W * 0.3) * e;
    y = cy;
  } else {
    const a = -Math.PI / 2 + easeInOut(Math.min(1, (lf - 40) / 120)) * 4 * Math.PI; // 2 slow loops, then hold
    x = cx + Math.cos(a) * r;
    y = cy + Math.sin(a) * r * 0.82;
  }
  return { x, y, scene, click: lf === 172 };
}

interface CaptureApi {
  frames: number;
  init: (mode: ModeKey) => Promise<{ W: number; H: number; totalFrames: number }>;
  renderRange: (start: number, end: number) => Promise<{ rendered: number; posted: number }>;
}

interface Fonts {
  display: string;
  jp: string;
  mono: string;
}

/**
 * Paint the site chrome onto an output frame: the Yūgen wordmark (top-left)
 * and the per-scene caption (bottom-left), matching the app's layout, fonts
 * and colours. The caption fades in over the first ~0.6s of each scene, as it
 * does on the real page. Coordinates are the 1280×720 design scaled to output.
 */
function drawChrome(ctx: CanvasRenderingContext2D, cfg: SceneConfig, lf: number, fonts: Fonts) {
  const S = CAP.outW / 1280;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Wordmark: red dot · Yūgen · 幽玄
  const padX = 36 * S;
  const headY = 26 * S + 16 * S;
  const dotR = 6.5 * S;
  ctx.fillStyle = "#D93A2B";
  ctx.beginPath();
  ctx.arc(padX + dotR, headY - 5 * S, dotR, 0, 7);
  ctx.fill();
  let x = padX + dotR * 2 + 12 * S;
  ctx.fillStyle = cfg.ink;
  ctx.letterSpacing = `${0.02 * 19 * S}px`;
  ctx.font = `${19 * S}px ${fonts.display}`;
  ctx.fillText("Yūgen", x, headY);
  x += ctx.measureText("Yūgen").width + 10 * S;
  ctx.globalAlpha = 0.55;
  ctx.letterSpacing = "0px";
  ctx.font = `${12 * S}px ${fonts.jp}`;
  ctx.fillText("幽玄", x, headY - 1 * S);
  ctx.globalAlpha = 1;

  // Caption: ja big, en small mono — fade in per scene (site uses ~640ms)
  const fade = easeInOut(Math.min(1, lf / 18));
  const leftC = 36 * S;
  const enY = CAP.outH - 34 * S;
  const jaY = enY - 22 * S;
  ctx.fillStyle = cfg.ink;
  ctx.globalAlpha = fade;
  ctx.letterSpacing = `${0.04 * 30 * S}px`;
  ctx.font = `${30 * S}px ${fonts.jp}`;
  ctx.fillText(cfg.ja, leftC, jaY);
  ctx.globalAlpha = fade * 0.62;
  ctx.letterSpacing = `${0.22 * 11 * S}px`;
  ctx.font = `${11 * S}px ${fonts.mono}`;
  ctx.fillText(cfg.en.toUpperCase(), leftC, enY);
  ctx.restore();
}

/** Expose the deterministic capture driver on window (dev only). */
export function exposeCapture(canvas: HTMLCanvasElement, oldEngine: FlockEngine, startMode: ModeKey) {
  let engine: FlockEngine | null = null;
  let order: ModeKey[] = [];
  const fonts: Fonts = { display: "serif", jp: "sans-serif", mono: "monospace" };
  const out = document.createElement("canvas");
  out.width = CAP.outW;
  out.height = CAP.outH;
  const octx = out.getContext("2d")!;
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const api: CaptureApi = {
    frames: 0,
    async init(mode) {
      oldEngine.destroy();
      const cs = getComputedStyle(document.documentElement);
      fonts.display = cs.getPropertyValue("--font-display").trim() || fonts.display;
      fonts.jp = cs.getPropertyValue("--font-jp").trim() || fonts.jp;
      fonts.mono = cs.getPropertyValue("--font-mono").trim() || fonts.mono;
      await document.fonts.ready;
      order = [mode, ...MODE_KEYS.filter((k) => k !== mode)];
      engine = new FlockEngine(canvas, {
        startMode: mode,
        density: "natural",
        pace: "natural",
        onModeCommitted: () => {},
      });
      engine.captureInit(mode);
      api.frames = order.length * CAP.framesPerScene;
      return { W: W(), H: H(), totalFrames: api.frames };
    },
    async renderRange(start, end) {
      const batch: Array<{ i: number; jpg: string }> = [];
      for (let f = start; f < end; f++) {
        const { x, y, scene, click } = scriptedPointer(f, W(), H());
        if (f % CAP.framesPerScene === 0) engine!.captureSetScene(order[scene]);
        const now = f * (1000 / CAP.fps);
        if (click) engine!.captureClick(x, y, now);
        engine!.captureFrame(now, x, y);
        octx.drawImage(canvas, 0, 0, CAP.outW, CAP.outH);
        drawChrome(octx, SCENES[order[scene]].cfg, f % CAP.framesPerScene, fonts);
        batch.push({ i: f, jpg: out.toDataURL("image/jpeg", 0.92).split(",")[1] });
      }
      const res = await fetch("http://127.0.0.1:8791/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: batch }),
      });
      const j = await res.json();
      return { rendered: end - start, posted: j.written };
    },
  };
  (window as unknown as { __inkcap: CaptureApi }).__inkcap = api;
}

/** Attach the harness to window in dev so a headless driver can invoke it. */
export function exposeRecorder(canvas: HTMLCanvasElement, engine: FlockEngine, startMode: ModeKey) {
  const g = window as unknown as {
    __inkflock?: {
      record: () => void;
      result: RecordResult | null;
      error: string | null;
      scenes: string[];
    };
  };
  g.__inkflock = {
    result: null,
    error: null,
    scenes: MODE_KEYS.map((k) => SCENES[k].cfg.label),
    record() {
      g.__inkflock!.result = null;
      g.__inkflock!.error = null;
      recordShowreel(canvas, engine, startMode)
        .then((r) => (g.__inkflock!.result = r))
        .catch((e) => (g.__inkflock!.error = String(e?.message ?? e)));
    },
  };
}
