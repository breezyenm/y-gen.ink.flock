import { describe, expect, it } from "vitest";
import {
  REF_AREA,
  REF_SHORT,
  SCALE_MIN,
  classifyGesture,
  scaledCount,
  viewportScale,
} from "./responsive";

describe("viewportScale", () => {
  it("is exactly 1 at desktop dimensions (faithful-port guarantee)", () => {
    expect(viewportScale(1440, 900)).toBe(1);
    expect(viewportScale(1280, 800)).toBe(1);
    expect(viewportScale(1920, 1080)).toBe(1);
  });

  it("is 1 when the short side is at the reference", () => {
    expect(viewportScale(REF_SHORT, REF_SHORT)).toBe(1);
    expect(viewportScale(1180, REF_SHORT)).toBe(1); // tablet landscape
  });

  it("scales down on phones but never below the floor", () => {
    const phone = viewportScale(375, 812); // portrait phone
    expect(phone).toBeGreaterThanOrEqual(SCALE_MIN);
    expect(phone).toBeLessThan(1);
    expect(viewportScale(320, 480)).toBe(SCALE_MIN); // tiny → clamped to floor
  });

  it("uses the limiting (short) dimension in either orientation", () => {
    expect(viewportScale(812, 375)).toBe(viewportScale(375, 812));
  });

  it("is defensive against zero/negative sizes", () => {
    expect(viewportScale(0, 0)).toBe(1);
  });
});

describe("scaledCount", () => {
  it("returns the full base count at/above the reference area (desktop untouched)", () => {
    expect(scaledCount(13, 1280, 800)).toBe(13);
    expect(scaledCount(13, 1440, 900)).toBe(13);
  });

  it("reduces the count proportionally to area on small screens", () => {
    const phone = scaledCount(13, 375, 812); // ~0.30 of ref area
    expect(phone).toBeLessThan(13);
    expect(phone).toBeGreaterThanOrEqual(3);
  });

  it("never drops below the floor of 3", () => {
    expect(scaledCount(13, 100, 100)).toBe(3);
    expect(scaledCount(4, 200, 200)).toBe(3);
  });

  it("REF_AREA is the documented baseline", () => {
    expect(REF_AREA).toBe(1280 * 800);
  });
});

describe("classifyGesture", () => {
  it("small + brief press is a tap (scatter)", () => {
    expect(classifyGesture(3, 120)).toBe("tap");
    expect(classifyGesture(10, 250)).toBe("tap"); // boundary inclusive
  });

  it("travel beyond the threshold is a drag (lead, no scatter)", () => {
    expect(classifyGesture(40, 120)).toBe("drag");
  });

  it("dwell beyond the threshold is a drag even with little travel", () => {
    expect(classifyGesture(2, 600)).toBe("drag");
  });
});
