// Scene registry. Each scene is fully defined in lib/flock/scenes/<key>.ts —
// constants, agent setup, behaviour decorations, and painting live together.
// This file only assembles them and holds the global sim multipliers.

import { birdsScene } from "./scenes/birds";
import { koiScene } from "./scenes/koi";
import { safariScene } from "./scenes/safari";
import type { Density, ModeKey, Pace, Scene } from "./types";

export type { Density, ModeKey, Pace } from "./types";

export const SCENES: Record<ModeKey, Scene> = {
  birds: birdsScene,
  koi: koiScene,
  safari: safariScene,
};

export const MODE_KEYS: ModeKey[] = ["birds", "koi", "safari"];

export const DENSITY_MUL: Record<Density, number> = { sparse: 0.55, natural: 1, abundant: 1.7 };
export const PACE_MUL: Record<Pace, number> = { drifting: 0.72, natural: 1, lively: 1.38 };
