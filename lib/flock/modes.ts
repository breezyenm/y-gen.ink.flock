// Single source of truth for the simulation: every scene constant and
// scene colour lives here, ported 1:1 from the Ink Flock prototype.

export type ModeKey = "birds" | "koi" | "safari";
export type Density = "sparse" | "natural" | "abundant";
export type Pace = "drifting" | "natural" | "lively";
export type KoiTone = "shu" | "akari" | "jade" | "washi";

export interface ModeConfig {
  kanji: string;
  label: string;
  ja: string;
  en: string;
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
  ink: string;
  veil: string;
}

export const MODES: Record<ModeKey, ModeConfig> = {
  birds: {
    kanji: "鳥", label: "Birds", ja: "「渡り鳥」", en: "The sky remembers the way",
    count: 46, maxSpeed: 4.4, maxForce: 0.14, minSpeed: 1.5,
    rSep: 26, rAli: 60, rCoh: 90, wSep: 1.7, wAli: 0.9, wCoh: 0.65, wSeek: 0.95, arrive: 130, orbit: 70,
    ink: "#161B1A", veil: "#F5EFE2",
  },
  koi: {
    kanji: "鯉", label: "Koi", ja: "「錦鯉」", en: "Beneath the surface, patience",
    count: 13, maxSpeed: 2.15, maxForce: 0.105, minSpeed: 0.45,
    rSep: 42, rAli: 46, rCoh: 70, wSep: 1.5, wAli: 0.7, wCoh: 0.5, wSeek: 0.6, arrive: 170, orbit: 90,
    ink: "#FBF8F1", veil: "#081312",
  },
  safari: {
    kanji: "群", label: "Safari", ja: "「大移動」", en: "The plain moves as one",
    count: 24, maxSpeed: 3.3, maxForce: 0.11, minSpeed: 0.2,
    rSep: 30, rAli: 55, rCoh: 85, wSep: 1.8, wAli: 0.85, wCoh: 0.6, wSeek: 0.9, arrive: 110, orbit: 55,
    ink: "#FDF4E6", veil: "#241407",
  },
};

export const MODE_KEYS: ModeKey[] = ["birds", "koi", "safari"];

export const DENSITY_MUL: Record<Density, number> = { sparse: 0.55, natural: 1, abundant: 1.7 };
export const PACE_MUL: Record<Pace, number> = { drifting: 0.72, natural: 1, lively: 1.38 };

// Faint chrome colour per mode (mode-switcher rest state).
export const FAINT_INK: Record<ModeKey, string> = {
  birds: "rgba(22,27,26,0.45)",
  koi: "rgba(251,248,241,0.48)",
  safari: "rgba(253,244,230,0.5)",
};
