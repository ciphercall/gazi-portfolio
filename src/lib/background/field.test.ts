import { describe, expect, it } from "vitest";

import {
  CYCLE_MS,
  FIELD_GLYPHS,
  HOLD_MS,
  MORPH_MS,
  applyPointerInfluence,
  blendedRing,
  glyphTransform,
  iconAlpha,
  iconShapeIndex,
  morphState,
  rippleProgress,
} from "./field";
import { GLYPH_NAMES, ICON_ASSETS, RING_POINTS, SHAPE_RINGS, SHAPES } from "./glyph-shapes";

describe("glyph rings", () => {
  it("has one ring per industry motif", () => {
    expect(SHAPE_RINGS).toHaveLength(GLYPH_NAMES.length);
    expect(GLYPH_NAMES).toEqual([
      "database",
      "document",
      "monitor",
      "phone",
      "cloud",
      "shield",
      "chip",
      "code",
    ]);
  });

  it("resamples every silhouette to the same closed point count", () => {
    for (const name of GLYPH_NAMES) {
      const ring = SHAPES[name];
      expect(ring).toHaveLength(RING_POINTS);
      expect(ring.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
      expect(ring.every((point) => Math.abs(point.x) <= 0.55 && Math.abs(point.y) <= 0.55)).toBe(true);
    }
  });
});

describe("morphState", () => {
  it("holds the first silhouette, then morphs into the next", () => {
    const start = morphState(0, 0);
    expect(start.from).toBe(0);
    expect(start.to).toBe(1);
    expect(start.t).toBe(0);

    const middle = morphState(HOLD_MS + MORPH_MS / 2, 0);
    expect(middle.from).toBe(0);
    expect(middle.to).toBe(1);
    expect(middle.t).toBeGreaterThan(0);
    expect(middle.t).toBeLessThan(1);

    const afterOneCycle = morphState(CYCLE_MS, 0);
    expect(afterOneCycle.from).toBe(1);
    expect(afterOneCycle.to).toBe(2);
    expect(afterOneCycle.t).toBe(0);
  });

  it("wraps shape indices instead of going out of bounds", () => {
    for (let step = 0; step < 40; step += 1) {
      const state = morphState(step * 2300, 0.31 + step * 0.07);
      expect(state.from).toBeGreaterThanOrEqual(0);
      expect(state.to).toBeGreaterThanOrEqual(0);
      expect(state.from).toBeLessThan(GLYPH_NAMES.length);
      expect(state.to).toBeLessThan(GLYPH_NAMES.length);
      expect(state.t).toBeGreaterThanOrEqual(0);
      expect(state.t).toBeLessThanOrEqual(1);
    }
  });
});

describe("blendedRing", () => {
  it("returns the endpoints unchanged when t is 0 or 1", () => {
    const a = SHAPES.database;
    const b = SHAPES.cloud;

    expect(blendedRing(a, b, 0, 0, 0)).toEqual(a);
    expect(blendedRing(a, b, 1, 0, 0)).toEqual(b);
  });

  it("stays interpolatable in between", () => {
    const middle = blendedRing(SHAPES.phone, SHAPES.shield, 0.5, 0, 0);
    expect(middle).toHaveLength(RING_POINTS);
    expect(middle.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });
});

describe("applyPointerInfluence", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 500, y: 0 },
  ];

  it("pulls nearby points toward the pointer and leaves distant ones alone", () => {
    const moved = applyPointerInfluence(points, { x: 100, y: 0 }, 200, 20);

    expect(moved[0]!.x).toBeGreaterThan(points[0]!.x);
    expect(moved[1]!.x).toBeGreaterThan(points[1]!.x);
    expect(moved[2]).toEqual(points[2]);
  });

  it("is a no-op without a pointer", () => {
    expect(applyPointerInfluence(points, null, 200, 20)).toEqual(points);
  });
});

describe("glyphTransform", () => {
  it("is deterministic for the same time and viewport", () => {
    const glyph = FIELD_GLYPHS[0]!;
    const first = glyphTransform(glyph, 12000, 1440, 900);
    const second = glyphTransform(glyph, 12000, 1440, 900);
    expect(first).toEqual(second);
  });

  it("keeps each glyph near its anchor", () => {
    for (const glyph of FIELD_GLYPHS) {
      for (const time of [0, 18000, 64000]) {
        const transform = glyphTransform(glyph, time, 1440, 900);
        expect(Math.abs(transform.cx / 1440 - glyph.x)).toBeLessThan(0.05);
        expect(Math.abs(transform.cy / 900 - glyph.y)).toBeLessThan(0.05);
        expect(transform.size).toBeGreaterThan(300);
      }
    }
  });
});

describe("rippleProgress", () => {
  it("clamps the ripple to its lifetime", () => {
    expect(rippleProgress(-50)).toBe(0);
    expect(rippleProgress(600)).toBeCloseTo(0.5, 5);
    expect(rippleProgress(5000)).toBe(1);
  });
});

describe("icon reveal", () => {
  it("is fully visible while the shape rests", () => {
    expect(iconAlpha(0, 0)).toBe(1);
    expect(iconAlpha(HOLD_MS - 1, 0)).toBe(1);
  });

  it("fades out at the start of a morph and back in at the end", () => {
    const fading = iconAlpha(HOLD_MS + MORPH_MS * 0.1, 0);
    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(0.9);
    expect(iconAlpha(HOLD_MS + MORPH_MS * 0.5, 0)).toBe(0);
    expect(iconAlpha(HOLD_MS + MORPH_MS * 0.95, 0)).toBeGreaterThan(0.8);
  });

  it("is fully back when the next hold begins", () => {
    expect(iconAlpha(CYCLE_MS - 0.001, 0)).toBeCloseTo(1, 3);
    expect(iconAlpha(CYCLE_MS + 500, 0)).toBe(1);
  });

  it("switches to the destination icon only once the morph is past halfway", () => {
    const early = morphState(HOLD_MS + MORPH_MS * 0.2, 0);
    const late = morphState(HOLD_MS + MORPH_MS * 0.9, 0);
    expect(iconShapeIndex(early)).toBe(early.from);
    expect(iconShapeIndex(late)).toBe(late.to);
  });

  it("maps every element to a vendored SVG icon asset", () => {
    for (const name of GLYPH_NAMES) {
      expect(ICON_ASSETS[name]).toMatch(/^\/icons\/field\/[a-z-]+\.svg$/);
    }
    expect(new Set(Object.values(ICON_ASSETS)).size).toBe(GLYPH_NAMES.length);
  });
});
