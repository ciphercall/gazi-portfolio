import { SHAPE_RINGS, type Point } from "./glyph-shapes";

/**
 * Motion rules for the living background. Pure functions only — the canvas
 * renderer stays a thin adapter, and the maths is unit-tested.
 *
 * The mobile painter mirrors these rules in `lib/widgets/background_field.dart`.
 */

export interface FieldGlyph {
  /** Anchor in viewport fractions. */
  x: number;
  y: number;
  /** Diameter as a fraction of the viewport's shortest side. */
  size: number;
  /** Offset into the morph cycle, 0–1. */
  phase: number;
  driftX: number;
  driftY: number;
  spin: number;
  /** Fractional offset into the silhouette list. */
  shapeOffset: number;
}

export const FIELD_GLYPHS: readonly FieldGlyph[] = [
  { x: 0.11, y: 0.2, size: 0.5, phase: 0.02, driftX: 0.016, driftY: 0.03, spin: 0.5, shapeOffset: 0 },
  { x: 0.84, y: 0.16, size: 0.42, phase: 0.37, driftX: 0.014, driftY: 0.024, spin: -0.4, shapeOffset: 0.35 },
  { x: 0.68, y: 0.62, size: 0.56, phase: 0.63, driftX: 0.02, driftY: 0.03, spin: 0.35, shapeOffset: 0.6 },
  { x: 0.18, y: 0.72, size: 0.44, phase: 0.18, driftX: 0.012, driftY: 0.022, spin: -0.55, shapeOffset: 0.15 },
  { x: 0.46, y: 0.38, size: 0.34, phase: 0.81, driftX: 0.018, driftY: 0.026, spin: 0.45, shapeOffset: 0.8 },
  { x: 0.93, y: 0.82, size: 0.38, phase: 0.51, driftX: 0.01, driftY: 0.018, spin: -0.3, shapeOffset: 0.5 },
];

export const HOLD_MS = 11000;
export const MORPH_MS = 3000;
export const CYCLE_MS = HOLD_MS + MORPH_MS;
export const RIPPLE_MS = 1200;

export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export interface MorphState {
  from: number;
  to: number;
  /** 0 = still on `from`, 1 = arrived at `to`. */
  t: number;
  index: number;
}

export function morphState(
  elapsedMs: number,
  phase: number,
  shapeOffset = 0,
  shapes = SHAPE_RINGS.length,
): MorphState {
  const shifted = elapsedMs + phase * CYCLE_MS;
  const index = Math.floor(shifted / CYCLE_MS) + Math.round(shapeOffset * shapes);
  const local = shifted % CYCLE_MS;
  const t = local <= HOLD_MS ? 0 : easeInOutCubic((local - HOLD_MS) / MORPH_MS);

  return {
    from: ((index % shapes) + shapes) % shapes,
    to: (((index + 1) % shapes) + shapes) % shapes,
    t,
    index: ((index % shapes) + shapes) % shapes,
  };
}

export function blendedRing(
  from: Point[],
  to: Point[],
  t: number,
  wobble: number,
  timeMs: number,
): Point[] {
  const count = Math.min(from.length, to.length);
  const result: Point[] = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const a = from[i];
    const b = to[i];
    if (!a || !b) continue;
    const angle = (i / count) * Math.PI * 2;
    const wobbleX = Math.sin(timeMs * 0.0006 + angle * 2.3) * wobble;
    const wobbleY = Math.cos(timeMs * 0.0005 + angle * 1.7) * wobble;

    result[i] = {
      x: a.x * (1 - t) + b.x * t + wobbleX,
      y: a.y * (1 - t) + b.y * t + wobbleY,
    };
  }

  return result;
}

/**
 * Pulls the side of a ring nearest the pointer toward it, so the glyph reads as
 * liquid metal rather than a rotating sticker.
 */
export function applyPointerInfluence(
  points: Point[],
  pointer: Point | null,
  radius: number,
  strength: number,
): Point[] {
  if (!pointer || strength <= 0 || radius <= 0) return points;

  return points.map((point) => {
    const dx = pointer.x - point.x;
    const dy = pointer.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius || distance === 0) return point;

    const falloff = Math.pow(1 - distance / radius, 2) * strength;
    return {
      x: point.x + (dx / distance) * falloff,
      y: point.y + (dy / distance) * falloff,
    };
  });
}

export function rippleProgress(ageMs: number, durationMs = RIPPLE_MS): number {
  return Math.min(1, Math.max(0, ageMs / durationMs));
}

/** Fraction of the morph spent fading the settled icon out / the next one in. */
export const ICON_FADE_OUT = 0.18;
export const ICON_FADE_IN = 0.28;

/**
 * How visible the element's icon is at this moment: fully visible while the
 * shape rests, gone during the middle of the morph, and cross-faded at the two
 * boundaries so the icon never pops.
 */
export function iconAlpha(elapsedMs: number, phase: number): number {
  const shifted = elapsedMs + phase * CYCLE_MS;
  const local = shifted % CYCLE_MS;
  if (local <= HOLD_MS) return 1;

  const morph = local - HOLD_MS;
  const fadeOut = MORPH_MS * ICON_FADE_OUT;
  const fadeInStart = MORPH_MS * (1 - ICON_FADE_IN);

  if (morph <= fadeOut) return 1 - easeInOutCubic(morph / fadeOut);
  if (morph >= fadeInStart) {
    return easeInOutCubic((morph - fadeInStart) / (MORPH_MS - fadeInStart));
  }
  return 0;
}

/** The element whose icon should be drawn for a given morph state. */
export function iconShapeIndex(state: MorphState): number {
  return state.t < 0.5 ? state.from : state.to;
}

/** Deterministic drift, so every visit sees the same composition. */
export function glyphTransform(
  glyph: FieldGlyph,
  elapsedMs: number,
  width: number,
  height: number,
): { cx: number; cy: number; size: number; rotation: number } {
  const t = elapsedMs / 1000;
  const cx = (glyph.x + Math.sin(t * 0.05 + glyph.phase * 6.28) * glyph.driftX) * width;
  const cy = (glyph.y + Math.cos(t * 0.043 + glyph.phase * 5.1) * glyph.driftY) * height;
  const size = glyph.size * Math.min(width, height);
  const rotation = Math.sin(t * 0.035 + glyph.phase * 4.2) * glyph.spin;

  return { cx, cy, size, rotation };
}
