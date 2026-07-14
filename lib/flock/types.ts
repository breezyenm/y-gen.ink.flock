// Shared vocabulary of the flock: agent state, scene contract, config shapes.
// The boids core (engine.ts) is scene-agnostic; everything a scene looks or
// behaves like lives behind the Scene seam, one adapter per mode.

export type ModeKey = "birds" | "koi" | "safari";
export type Density = "sparse" | "natural" | "abundant";
export type Pace = "drifting" | "natural" | "lively";
export type KoiTone = "shu" | "akari" | "jade" | "washi";

export interface Pt {
  x: number;
  y: number;
}

export interface Agent {
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
  /** Koi only: body colour family. */
  tone?: KoiTone;
  /** Koi only: trail points, head first. */
  pts?: Pt[];
}

/** Vertical band agents are held to (safari's ground strip). */
export interface BandSpec {
  topFrac: number;
  topPad: number;
  botPad: number;
}

export interface SceneConfig {
  // Chrome
  kanji: string;
  label: string;
  ja: string;
  en: string;
  ink: string;
  veil: string;
  faint: string;
  // Flock physics
  count: number;
  maxSpeed: number;
  maxForce: number;
  minSpeed: number;
  rSep: number;
  rAli: number;
  rCoh: number;
  wSep: number;
  wAli: number;
  wCoh: number;
  wSeek: number;
  arrive: number;
  orbit: number;
  /** Flattens the orbit ellipse vertically (default 1). */
  orbitYScale?: number;
  /** Constrain agents and the seek target to a ground band. */
  band?: BandSpec;
}

export function bandOf(band: BandSpec, h: number): { top: number; bot: number } {
  return { top: h * band.topFrac + band.topPad, bot: h - band.botPad };
}

/** Deterministic decor randomness, seeded by the engine from canvas size. */
export type SeededFn = (n: number, salt: number) => number[][];

export interface Scene {
  readonly key: ModeKey;
  readonly cfg: SceneConfig;
  /** Adjust a freshly built base agent (scale, tones, trails, spawn area). */
  initAgent(a: Agent, i: number, w: number, h: number): void;
  /** After the core integrates an agent each tick: trails, dust, etc. */
  afterAgentStep?(a: Agent, sp: number, now: number): void;
  /** Once per tick after all agents have stepped: ambient effects. */
  afterFrame?(agents: Agent[], now: number): void;
  /** Pointer-down effect at (x, y) — e.g. the koi click ripple. */
  onPointerDown?(x: number, y: number, now: number): void;
  /** Clear scene-owned effect state; called when the scene becomes active. */
  reset?(): void;
  drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, seeded: SeededFn): void;
  /** Paint agents and scene effects; owns draw order. */
  drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[], now: number, w: number, h: number): void;
}
