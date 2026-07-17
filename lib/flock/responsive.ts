// Viewport-driven scaling + touch-gesture classification for the responsive
// retrofit. Pure functions, no DOM — the risky arithmetic lives here so it can
// be unit-tested; the engine calls into it. See _goals/responsive-mobile-tablet.
//
// Faithful-port guarantee: at desktop dimensions every function returns the
// identity (scale 1, full count), so the shipped desktop sim is byte-identical.

/** Short-side reference (px) at/above which spatial scale is 1 (desktop + most tablets). */
export const REF_SHORT = 800;
/** Floor for the spatial scale so a phone never collapses the geometry to nothing. */
export const SCALE_MIN = 0.6;
/** Reference area (px²) at/above which the full agent count is used. */
export const REF_AREA = 1280 * 800;

/** Tap-vs-drag thresholds (see interface-brief Q1). */
export const TAP_MOVE_PX = 10;
export const TAP_TIME_MS = 250;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Spatial scale factor for the given viewport. Multiplies the sim's absolute-px
 * constants (orbit, separation radii, edge margin, arrive, scare) so the
 * composition holds proportionally instead of cramming desktop geometry onto a
 * phone. Returns exactly 1 when the short side ≥ REF_SHORT (desktop/tablet).
 */
export function viewportScale(w: number, h: number): number {
  const shortSide = Math.min(w, h);
  if (shortSide <= 0) return 1;
  return clamp(shortSide / REF_SHORT, SCALE_MIN, 1);
}

/**
 * Agent count for the given viewport: the base count scaled by area ratio, with
 * a hard floor of 3. Returns the full base count when area ≥ REF_AREA (desktop).
 */
export function scaledCount(baseCount: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return baseCount;
  const ratio = Math.min(1, (w * h) / REF_AREA);
  return Math.max(3, Math.round(baseCount * ratio));
}

export type Gesture = "tap" | "drag";

/**
 * Classify a completed touch/pen pointer interaction. A small, brief press is a
 * tap (scatter); anything with more travel or dwell was a lead-drag (no scatter).
 */
export function classifyGesture(movedPx: number, elapsedMs: number): Gesture {
  return movedPx <= TAP_MOVE_PX && elapsedMs <= TAP_TIME_MS ? "tap" : "drag";
}
